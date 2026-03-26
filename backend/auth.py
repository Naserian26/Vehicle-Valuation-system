import secrets
import string
import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity
from flask_mail import Message
from bson.objectid import ObjectId
from database import mongo
from extensions import mail, bcrypt  # ← bcrypt from extensions, not local

auth = Blueprint('auth', __name__)

def generate_temp_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def send_email(subject, recipient, body):
    msg = Message(subject, recipients=[recipient])
    msg.body = body
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def get_client_ip():
    return request.headers.get('X-Forwarded-For', request.remote_addr)

def log_event(level, event, message, user=None, ip=None, role=None, extra=None):
    entry = {
        "level":     level,
        "event":     event,
        "message":   message,
        "user":      user,
        "ip":        ip,
        "role":      role,
        "timestamp": datetime.datetime.utcnow(),
    }
    if extra:
        entry.update(extra)
    try:
        mongo.db.logs.insert_one(entry)
    except Exception as e:
        print(f"[LOG ERROR] {e}")

# ==========================
# 1. LOGIN
# ==========================
@auth.route('/login', methods=['POST'])
def login():
    data     = request.json
    email    = data.get('email')
    password = data.get('password')
    ip       = get_client_ip()

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = mongo.db.users.find_one({"email": email})

    if user and bcrypt.check_password_hash(user['password'], password):
        role                 = user.get('role', 'user')
        must_change_password = user.get('must_change_password', False)

        token = create_access_token(
            identity=str(user['_id']),
            additional_claims={"role": role}
        )

        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"active_token": token}}
        )

        log_event(
            level="INFO",
            event="login_success",
            message=f"Successful login for '{email}'",
            user=email,
            ip=ip,
            role=role
        )

        return jsonify({
            "token":                token,
            "role":                 role,
            "email":                user['email'],
            "must_change_password": must_change_password
        }), 200

    log_event(
        level="WARNING",
        event="login_failed",
        message=f"Failed login attempt for '{email}'",
        user=email,
        ip=ip,
        role=None
    )

    return jsonify({"message": "Invalid credentials"}), 401

# ==========================
# 2. LOGOUT
# ==========================
@auth.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$unset": {"active_token": ""}}
    )
    return jsonify({"message": "Logged out successfully"}), 200

# ==========================
# 3. REGISTER
# ==========================
@auth.route('/register', methods=['POST'])
def register():
    data  = request.json
    email = data.get('email')
    token = data.get('token')
    ip    = get_client_ip()

    if not email:
        return jsonify({"message": "Email is required"}), 400

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    role   = 'user'
    invite = None

    if token:
        invite = mongo.db.invites.find_one({"token": token, "email": email, "used": False})
        if not invite:
            return jsonify({"message": "Invalid or expired invite token"}), 400
        if invite['expires_at'] < datetime.datetime.utcnow():
            return jsonify({"message": "Invite token has expired"}), 400
        role = invite.get('role', 'business_admin')

    temp_password   = generate_temp_password()
    hashed_password = bcrypt.generate_password_hash(temp_password).decode('utf-8')

    user_data = {
        "email":                email,
        "password":             hashed_password,
        "role":                 role,
        "must_change_password": True,
        "createdAt":            datetime.datetime.utcnow()
    }

    mongo.db.users.insert_one(user_data)

    if invite:
        mongo.db.invites.update_one({"_id": invite['_id']}, {"$set": {"used": True}})

    email_body = (
        f"Welcome to Vehicle Valuation!\n"
        f"Your temporary password is: {temp_password}\n"
        f"Please log in and change your password immediately."
    )

    print(f"🔐 TEMP PASSWORD SENT: Email={email}, Password={temp_password}")
    send_email("Your Temporary Password", email, email_body)

    log_event(
        level="INFO",
        event="user_created",
        message=f"New user '{email}' registered with role '{role}'",
        user=email,
        ip=ip,
        role=role
    )

    return jsonify({"message": "Registration successful. Check your email for a temporary password."}), 201

# ==========================
# 4. VALIDATE INVITE
# ==========================
@auth.route('/validate-invite', methods=['GET'])
def validate_invite():
    token = request.args.get('token')
    if not token:
        return jsonify({"valid": False, "message": "Token is required"}), 400

    invite = mongo.db.invites.find_one({"token": token, "used": False})
    if not invite or invite['expires_at'] < datetime.datetime.utcnow():
        return jsonify({"valid": False, "message": "Invalid or expired token"}), 400

    return jsonify({"valid": True, "email": invite['email']}), 200

# ==========================
# 5. CHANGE PASSWORD
# ==========================
@auth.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id      = get_jwt_identity()
    data         = request.json
    new_password = data.get('new_password')
    ip           = get_client_ip()

    if not new_password:
        return jsonify({"message": "New password is required"}), 400

    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_password, "must_change_password": False}}
    )

    log_event(
        level="INFO",
        event="password_reset",
        message=f"User '{user_id}' changed their password",
        user=user_id,
        ip=ip
    )

    return jsonify({"message": "Password updated successfully"}), 200

# ==========================
# 6. FORGOT PASSWORD
# ==========================
@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    data  = request.json
    email = data.get('email')
    ip    = get_client_ip()

    if not email:
        return jsonify({"message": "Email is required"}), 400

    user = mongo.db.users.find_one({"email": email})
    if user:
        token      = secrets.token_urlsafe(32)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)

        mongo.db.password_resets.update_one(
            {"email": email},
            {"$set": {"token": token, "expires_at": expires_at}},
            upsert=True
        )

        reset_link = f"http://localhost:5173/reset-password?token={token}"
        email_body = f"Click here to reset your password: {reset_link}"
        send_email("Password Reset", email, email_body)

        log_event(
            level="INFO",
            event="password_reset",
            message=f"Password reset requested for '{email}'",
            user=email,
            ip=ip
        )

    return jsonify({"message": "If that email is in our system, we've sent a reset link."}), 200

# ==========================
# 7. RESET PASSWORD
# ==========================
@auth.route('/reset-password', methods=['POST'])
def reset_password():
    data         = request.json
    token        = data.get('token')
    new_password = data.get('new_password')
    ip           = get_client_ip()

    if not token or not new_password:
        return jsonify({"message": "Token and new password required"}), 400

    reset_record = mongo.db.password_resets.find_one({"token": token})
    if not reset_record or reset_record['expires_at'] < datetime.datetime.utcnow():
        return jsonify({"message": "Invalid or expired token"}), 400

    email           = reset_record['email']
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')

    mongo.db.users.update_one(
        {"email": email},
        {"$set": {"password": hashed_password, "must_change_password": False}}
    )
    mongo.db.password_resets.delete_one({"_id": reset_record['_id']})

    log_event(
        level="INFO",
        event="password_reset",
        message=f"Password successfully reset for '{email}'",
        user=email,
        ip=ip
    )

    return jsonify({"message": "Password reset successful"}), 200
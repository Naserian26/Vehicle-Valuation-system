import secrets
import string
import datetime
from flask import Blueprint, jsonify, request, current_app
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity
from flask_mail import Message
from bson.objectid import ObjectId
from database import mongo

auth = Blueprint('auth', __name__)
bcrypt = Bcrypt()

# --- HELPER FUNCTIONS ---

def generate_temp_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def send_email(subject, recipient, body):
    from app import mail
    msg = Message(subject, recipients=[recipient])
    msg.body = body
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# --- AUTH ENDPOINTS ---

@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = mongo.db.users.find_one({"email": email})

    if user and bcrypt.check_password_hash(user['password'], password):
        role = user.get('role', 'user')
        must_change_password = user.get('must_change_password', False)

        token = create_access_token(
            identity=str(user['_id']),
            additional_claims={"role": role}
        )

        return jsonify({
            "token": token,
            "role": role,
            "email": user['email'],
            "must_change_password": must_change_password
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401

@auth.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    token = data.get('token') # For invite flow

    if not email:
        return jsonify({"message": "Email is required"}), 400

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    role = 'user'
    invite = None

    if token:
        invite = mongo.db.invites.find_one({"token": token, "email": email, "used": False})
        if not invite:
            return jsonify({"message": "Invalid or expired invite token"}), 400
        
        # Check expiry
        if invite['expires_at'] < datetime.datetime.utcnow():
            return jsonify({"message": "Invite token has expired"}), 400
        
        role = invite.get('role', 'business_admin')

    temp_password = generate_temp_password()
    hashed_password = bcrypt.generate_password_hash(temp_password).decode('utf-8')

    user_data = {
        "email": email,
        "password": hashed_password,
        "role": role,
        "must_change_password": True,
        "createdAt": datetime.datetime.utcnow()
    }

    mongo.db.users.insert_one(user_data)

    if invite:
        mongo.db.invites.update_one({"_id": invite['_id']}, {"$set": {"used": True}})

    email_body = f"Welcome to Vehicle Valuation!\nYour temporary password is: {temp_password}\nPlease log in and change your password immediately."
    
    # Log the temporary password for debugging
    print(f"🔐 TEMP PASSWORD SENT: Email={email}, Password={temp_password}")
    
    send_email("Your Temporary Password", email, email_body)

    return jsonify({"message": "Registration successful. Check your email for a temporary password."}), 201

@auth.route('/invite', methods=['POST'])
@jwt_required()
def invite_admin():
    claims = get_jwt()
    if claims.get('role') != 'super_admin':
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"message": "Email is required"}), 400

    token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)

    invite_data = {
        "email": email,
        "token": token,
        "role": "business_admin",
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.datetime.utcnow()
    }

    mongo.db.invites.insert_one(invite_data)

    invite_link = f"http://localhost:5173/register?token={token}"
    email_body = f"You have been invited to join as a Business Admin. Click here to register: {invite_link}"
    send_email("Invitation to Vehicle Valuation", email, email_body)

    return jsonify({"message": "Invite sent successfully"}), 200

@auth.route('/validate-invite', methods=['GET'])
def validate_invite():
    token = request.args.get('token')
    if not token:
        return jsonify({"valid": False, "message": "Token is required"}), 400

    invite = mongo.db.invites.find_one({"token": token, "used": False})
    if not invite or invite['expires_at'] < datetime.datetime.utcnow():
        return jsonify({"valid": False, "message": "Invalid or expired token"}), 400

    return jsonify({"valid": True, "email": invite['email']}), 200

@auth.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.json
    new_password = data.get('new_password')

    if not new_password:
        return jsonify({"message": "New password is required"}), 400

    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_password, "must_change_password": False}}
    )

    return jsonify({"message": "Password updated successfully"}), 200

@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"message": "Email is required"}), 400

    # Best practice: always return 200 even if user doesn't exist
    user = mongo.db.users.find_one({"email": email})
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        
        mongo.db.password_resets.update_one(
            {"email": email},
            {"$set": {"token": token, "expires_at": expires_at}},
            upsert=True
        )

        reset_link = f"http://localhost:5173/reset-password?token={token}"
        email_body = f"Click here to reset your password: {reset_link}"
        send_email("Password Reset", email, email_body)

    return jsonify({"message": "If that email is in our system, we've sent a reset link."}), 200

@auth.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({"message": "Token and new password required"}), 400

    reset_record = mongo.db.password_resets.find_one({"token": token})
    if not reset_record or reset_record['expires_at'] < datetime.datetime.utcnow():
        return jsonify({"message": "Invalid or expired token"}), 400

    email = reset_record['email']
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')

    mongo.db.users.update_one({"email": email}, {"$set": {"password": hashed_password, "must_change_password": False}})
    mongo.db.password_resets.delete_one({"_id": reset_record['_id']})

    return jsonify({"message": "Password reset successful"}), 200

# --- RESTORED RBAC MANAGEMENT ENDPOINTS ---

@auth.route('/', methods=['GET'])
@jwt_required()
def get_users():
    users = list(mongo.db.users.find({}, {"password": 0}))
    for user in users:
        user['_id'] = str(user['_id'])
    return jsonify(users), 200

@auth.route('/matrix', methods=['GET'])
@jwt_required()
def get_matrix():
    matrix = mongo.db.auth_matrix.find_one({}, {"_id": 0})
    if not matrix:
        # Default matrix if none exists
        matrix = {
            "view_dashboard": {"super_admin": True, "business_admin": True, "viewer": True},
            "calculate_taxes": {"super_admin": True, "business_admin": True, "viewer": False},
            "add_vehicles": {"super_admin": True, "business_admin": True, "viewer": False},
            "edit_vehicles": {"super_admin": True, "business_admin": True, "viewer": False},
            "search_vehicle_db": {"super_admin": True, "business_admin": True, "viewer": True},
            "create_users": {"super_admin": True, "business_admin": True, "viewer": False},
            "assign_user_roles": {"super_admin": True, "business_admin": True, "viewer": False}
        }
    return jsonify(matrix), 200

@auth.route('/update-matrix', methods=['POST'])
@jwt_required()
def update_matrix():
    claims = get_jwt()
    current_user_role = claims.get('role')
    
    if current_user_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.json
    feature = data.get('feature')
    target_role = data.get('role')
    enabled = data.get('enabled')

    # Security Validation
    if current_user_role == 'business_admin':
        if target_role != 'viewer':
            return jsonify({"message": "Business Admin can only modify Viewer permissions"}), 403

    if target_role == 'super_admin':
        return jsonify({"message": "Cannot modify Super Admin permissions"}), 400

    mongo.db.auth_matrix.update_one(
        {},
        {"$set": {f"{feature}.{target_role}": enabled}},
        upsert=True
    )
    return jsonify({"message": "Matrix updated"}), 200

@auth.route('/update-user-role', methods=['POST'])
@jwt_required()
def update_user_role():
    claims = get_jwt()
    if claims.get('role') not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    user_id = data.get('user_id')
    new_role = data.get('role')

    # Basic hierarchy check (simplified)
    if claims.get('role') == 'business_admin' and new_role == 'super_admin':
        return jsonify({"message": "Business Admin cannot promote to Super Admin"}), 403

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )
    return jsonify({"message": "Role updated"}), 200

@auth.route('/role-options', methods=['GET'])
@jwt_required()
def get_role_options():
    # Return mapping for frontend if needed
    return jsonify({
        "super_admin": "Super Admin",
        "business_admin": "Business Admin",
        "viewer": "Viewer"
    }), 200

@auth.route('/create-user-options', methods=['GET'])
@jwt_required()
def get_create_user_options():
    claims = get_jwt()
    role = claims.get('role')
    
    options = [{"value": "viewer", "label": "Viewer"}]
    if role == 'super_admin':
        options.append({"value": "business_admin", "label": "Business Admin"})
    
    return jsonify({"available_options": options}), 200

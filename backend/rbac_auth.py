import secrets
import string
import datetime
from flask import Blueprint, jsonify, request
from extensions import bcrypt
from flask_jwt_extended import (
    create_access_token, jwt_required,
    get_jwt, get_jwt_identity, verify_jwt_in_request
)
from flask_mail import Message
from bson.objectid import ObjectId
from database import mongo
from extensions import mail

auth = Blueprint('rbac_auth', __name__)


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
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


def send_email(subject, recipient, body):
    msg = Message(subject, recipients=[recipient])
    msg.body = body
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"[MAIL ERROR] {e}")
        return False


def generate_temp_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ─────────────────────────────────────────────────────────────
# SESSION VALIDATOR  (runs before every request on this blueprint)
# ─────────────────────────────────────────────────────────────
@auth.before_request
def validate_session():
    try:
        verify_jwt_in_request()
    except Exception:
        return   # let jwt_required() handle unauthenticated routes

    try:
        user_id       = get_jwt_identity()
        current_token = request.headers.get('Authorization', '').replace('Bearer ', '')

        user = mongo.db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"active_token": 1}
        )

        if not user:
            return jsonify({"message": "User not found"}), 401

        stored_token = user.get('active_token')
        if stored_token and stored_token != current_token:
            return jsonify({"message": "Session expired. Please login again."}), 401

    except Exception:
        return


# ═════════════════════════════════════════════════════════════
# 1. GET ALL USERS
# ═════════════════════════════════════════════════════════════
@auth.route('/', methods=['GET'])
@jwt_required()
def get_users():
    claims = get_jwt()
    role   = claims.get('role')

    if role not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Access denied"}), 403

    users = list(mongo.db.users.find({}, {"password": 0, "active_token": 0}))
    for u in users:
        u['_id'] = str(u['_id'])
    return jsonify(users), 200


# ═════════════════════════════════════════════════════════════
# 2. INVITE USER
#    super_admin  → can invite viewer OR business_admin
#    business_admin → viewer only (role is force-overridden)
# ═════════════════════════════════════════════════════════════
@auth.route('/invite', methods=['POST'])
@jwt_required()
def invite_user():
    claims     = get_jwt()
    admin_role = claims.get('role')
    caller_id  = get_jwt_identity()
    ip         = get_client_ip()

    if admin_role not in ['super_admin', 'business_admin']:
        log_event(
            level="WARNING", event="unauthorized_access",
            message=f"Role '{admin_role}' attempted to send an invite",
            user=caller_id, ip=ip, role=admin_role
        )
        return jsonify({"message": "Unauthorized"}), 403

    data  = request.json
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({"message": "Email is required"}), 400

    # ── ROLE ENFORCEMENT ──────────────────────────────────────
    requested_role = data.get('role', 'viewer')
    if admin_role == 'business_admin':
        # business_admin can ONLY invite viewers, regardless of what was sent
        assigned_role = 'viewer'
    else:
        # super_admin may assign viewer or business_admin
        assigned_role = requested_role if requested_role in ('viewer', 'business_admin') else 'viewer'
    # ─────────────────────────────────────────────────────────

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"message": "A user with this email already exists"}), 400

    token      = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)

    mongo.db.invites.insert_one({
        "email":      email,
        "token":      token,
        "role":       assigned_role,
        "expires_at": expires_at,
        "used":       False,
        "created_at": datetime.datetime.utcnow(),
        "invited_by": caller_id,
    })

    invite_link = f"http://localhost:5173/register?token={token}"
    role_label  = "Business Admin" if assigned_role == "business_admin" else "Viewer"
    email_body  = (
        f"You have been invited to join as {role_label}.\n"
        f"Click here to register: {invite_link}\n\n"
        f"This link expires in 24 hours."
    )
    send_email("Invitation to Vehicle Valuation", email, email_body)

    log_event(
        level="INFO", event="invite_sent",
        message=f"Invite sent to '{email}' for role '{assigned_role}'",
        user=caller_id, ip=ip, role=admin_role
    )

    return jsonify({"message": f"Invite sent to {email} successfully"}), 200


# ═════════════════════════════════════════════════════════════
# 3. CREATE USER DIRECTLY (no invite flow)
#    super_admin  → viewer or business_admin
#    business_admin → viewer only
# ═════════════════════════════════════════════════════════════
@auth.route('/create-user', methods=['POST'])
@jwt_required()
def create_user():
    claims     = get_jwt()
    admin_role = claims.get('role')
    caller_id  = get_jwt_identity()
    ip         = get_client_ip()

    if admin_role not in ['super_admin', 'business_admin']:
        log_event(
            level="WARNING", event="unauthorized_access",
            message=f"Role '{admin_role}' attempted to create a user",
            user=caller_id, ip=ip, role=admin_role
        )
        return jsonify({"message": "Unauthorized"}), 403

    data     = request.json
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"message": "A user with this email already exists"}), 400

    # ── ROLE ENFORCEMENT ──────────────────────────────────────
    requested_role = data.get('role', 'viewer')
    if admin_role == 'business_admin':
        assigned_role = 'viewer'
    else:
        assigned_role = requested_role if requested_role in ('viewer', 'business_admin') else 'viewer'
    # ─────────────────────────────────────────────────────────

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    mongo.db.users.insert_one({
        "email":                email,
        "password":             hashed_password,
        "role":                 assigned_role,
        "must_change_password": True,
        "createdAt":            datetime.datetime.utcnow(),
        "created_by":           caller_id,
    })

    log_event(
        level="INFO", event="user_created",
        message=f"User '{email}' created directly with role '{assigned_role}'",
        user=caller_id, ip=ip, role=admin_role
    )

    return jsonify({"message": f"User {email} created successfully"}), 201


# ═════════════════════════════════════════════════════════════
# 4. VALIDATE INVITE TOKEN
# ═════════════════════════════════════════════════════════════
@auth.route('/validate-invite', methods=['GET'])
def validate_invite():
    token = request.args.get('token')
    if not token:
        return jsonify({"valid": False, "message": "Token is required"}), 400

    invite = mongo.db.invites.find_one({"token": token, "used": False})
    if not invite or invite['expires_at'] < datetime.datetime.utcnow():
        return jsonify({"valid": False, "message": "Invalid or expired token"}), 400

    return jsonify({"valid": True, "email": invite['email'], "role": invite['role']}), 200


# ═════════════════════════════════════════════════════════════
# 5. PERMISSION MATRIX — GET
# ═════════════════════════════════════════════════════════════
@auth.route('/matrix', methods=['GET'])
@jwt_required()
def get_matrix():
    matrix = mongo.db.auth_matrix.find_one({}, {"_id": 0})
    if not matrix:
        matrix = {
            "view_dashboard":    {"super_admin": True,  "business_admin": True,  "viewer": True},
            "calculate_taxes":   {"super_admin": True,  "business_admin": True,  "viewer": False},
            "add_vehicles":      {"super_admin": True,  "business_admin": True,  "viewer": False},
            "edit_vehicles":     {"super_admin": True,  "business_admin": True,  "viewer": False},
            "search_vehicle_db": {"super_admin": True,  "business_admin": True,  "viewer": True},
            "create_users":      {"super_admin": True,  "business_admin": True,  "viewer": False},
            "assign_user_roles": {"super_admin": True,  "business_admin": False, "viewer": False},
        }
    return jsonify(matrix), 200


# ═════════════════════════════════════════════════════════════
# 6. PERMISSION MATRIX — UPDATE
#    super_admin  → can toggle business_admin OR viewer columns
#    business_admin → viewer column only
#    super_admin column → immutable
# ═════════════════════════════════════════════════════════════
@auth.route('/update-matrix', methods=['POST'])
@jwt_required()
def update_matrix():
    claims    = get_jwt()
    caller_role = claims.get('role')
    caller_id   = get_jwt_identity()
    ip          = get_client_ip()

    if caller_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Unauthorized"}), 403

    data        = request.json
    feature     = data.get('feature')
    target_role = data.get('role')
    enabled     = data.get('enabled')

    if not feature or target_role is None or enabled is None:
        return jsonify({"message": "feature, role, and enabled are required"}), 400

    # super_admin permissions are always on — never writable
    if target_role == 'super_admin':
        return jsonify({"message": "Cannot modify Super Admin permissions"}), 400

    # business_admin can only touch the viewer column
    if caller_role == 'business_admin' and target_role != 'viewer':
        log_event(
            level="WARNING", event="unauthorized_access",
            message=f"Business Admin tried to modify '{target_role}' column in matrix",
            user=caller_id, ip=ip, role=caller_role
        )
        return jsonify({"message": "Business Admin can only modify Viewer permissions"}), 403

    mongo.db.auth_matrix.update_one(
        {},
        {"$set": {f"{feature}.{target_role}": bool(enabled)}},
        upsert=True
    )

    log_event(
        level="INFO", event="matrix_updated",
        message=f"Matrix updated: {feature}.{target_role} = {enabled}",
        user=caller_id, ip=ip, role=caller_role
    )

    return jsonify({"message": "Matrix updated"}), 200


# ═════════════════════════════════════════════════════════════
# 7. UPDATE USER ROLE
#    super_admin  → any role except promoting to super_admin
#                   (super_admin created only at DB level)
#    business_admin → can only assign 'viewer'
# ═════════════════════════════════════════════════════════════
@auth.route('/update-user-role', methods=['POST'])
@jwt_required()
def update_user_role():
    claims      = get_jwt()
    caller_role = claims.get('role')
    caller_id   = get_jwt_identity()
    ip          = get_client_ip()

    if caller_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Unauthorized"}), 403

    data     = request.json
    user_id  = data.get('user_id')
    new_role = data.get('role')

    if not user_id or not new_role:
        return jsonify({"message": "user_id and role are required"}), 400

    # Nobody can promote to super_admin via API
    if new_role == 'super_admin':
        log_event(
            level="WARNING", event="unauthorized_access",
            message=f"Attempted promotion to super_admin via API",
            user=caller_id, ip=ip, role=caller_role
        )
        return jsonify({"message": "Cannot promote to Super Admin via API"}), 403

    # business_admin can only assign viewer
    if caller_role == 'business_admin' and new_role != 'viewer':
        log_event(
            level="WARNING", event="unauthorized_access",
            message=f"Business Admin tried to assign role '{new_role}'",
            user=caller_id, ip=ip, role=caller_role
        )
        return jsonify({"message": "Business Admin can only assign Viewer role"}), 403

    target_user = mongo.db.users.find_one(
        {"_id": ObjectId(user_id)}, {"role": 1, "email": 1}
    )
    if not target_user:
        return jsonify({"message": "User not found"}), 404

    old_role = target_user.get('role', 'unknown')

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )

    log_event(
        level="INFO", event="role_change",
        message=f"Role changed for '{target_user.get('email', user_id)}': {old_role} → {new_role}",
        user=caller_id, ip=ip, role=caller_role,
        extra={"old_role": old_role, "new_role": new_role, "target_user": user_id}
    )

    return jsonify({"message": "Role updated"}), 200


# ═════════════════════════════════════════════════════════════
# 8. ROLE OPTIONS  (drives dropdowns in the frontend)
# ═════════════════════════════════════════════════════════════
@auth.route('/role-options', methods=['GET'])
@jwt_required()
def get_role_options():
    claims = get_jwt()
    role   = claims.get('role')

    options = [{"value": "viewer", "label": "Viewer"}]
    if role == 'super_admin':
        options.append({"value": "business_admin", "label": "Business Admin"})

    return jsonify({"available_options": options}), 200


# ═════════════════════════════════════════════════════════════
# 9. SMTP SETTINGS  (super_admin & business_admin only)
# ═════════════════════════════════════════════════════════════
@auth.route('/smtp-settings', methods=['GET', 'POST'])
@jwt_required()
def smtp_settings():
    claims = get_jwt()
    role   = claims.get('role')

    if role not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Access denied"}), 403

    # Delegate to the admin blueprint handler by re-using the same DB collection
    if request.method == 'GET':
        config = mongo.db.smtp_config.find_one({}, {"_id": 0, "password": 0})
        return jsonify(config or {}), 200

    data = request.json
    mongo.db.smtp_config.update_one(
        {},
        {"$set": {k: v for k, v in data.items()}},
        upsert=True
    )
    return jsonify({"message": "SMTP settings saved"}), 200
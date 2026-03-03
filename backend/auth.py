from flask import Blueprint, jsonify, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from database import mongo
from bson.objectid import ObjectId
import datetime

auth = Blueprint('auth', __name__)
bcrypt = Bcrypt()

# RBAC Role Hierarchy
ROLE_HIERARCHY = {
    'viewer': 1,
    'business_admin': 2, 
    'super_admin': 3
}

def normalize_role(role):
    """Normalize role to lowercase with underscores."""
    if not role:
        return "viewer"
    return role.lower().strip().replace(" ", "_")

def get_role_level(role):
    """Get hierarchy level for a role."""
    normalized_role = normalize_role(role)
    return ROLE_HIERARCHY.get(normalized_role, 0)

def can_modify_role(admin_role, target_role, target_user_id=None, current_user_id=None):
    """Check if admin_role can modify target_role."""
    admin_level = get_role_level(admin_role)
    target_level = get_role_level(target_role)

    # Rule 1: Cannot modify own role
    if target_user_id and current_user_id and str(target_user_id) == str(current_user_id):
        return False, "Cannot modify your own role"

    # Rule 2: Viewers cannot modify any roles
    if admin_level <= 1:
        return False, "Viewers cannot modify roles"

    # Rule 3: Business Admin cannot modify another Business Admin
    if admin_level == 2 and target_level >= 2:
        return False, "Business Admins cannot modify other Business Admins"

    # Rule 4: Only Super Admin can modify Business Admin roles
    if admin_level == 2 and target_level >= 2:
        return False, "Only Super Admin can modify Business Admin roles"

    # Rule 5: Cannot modify Super Admin (except by Super Admin themselves)
    if target_level >= 3 and admin_level < 3:
        return False, "Super Admin roles can only be modified by Super Admins"

    return True, "Role modification allowed"

# ==========================
# 1. LOGIN
# ==========================
@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400

    user = mongo.db.users.find_one({"username": username})

    if user and bcrypt.check_password_hash(user['password'], password):
        role = normalize_role(user.get('role', 'viewer'))

        token = create_access_token(
            identity=str(user['_id']),
            additional_claims={"role": role}
        )

        return jsonify({
            "token": token,
            "role": role,
            "username": user['username']
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401

# ==========================
# 2. GET ALL USERS (ADMIN)
# ==========================
@auth.route('/', methods=['GET'])
@jwt_required()
def get_users():
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))

    if user_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": f"Access denied. Role '{user_role}' cannot view users"}), 403

    users = [
        {"_id": str(u['_id']), "username": u['username'], "role": u.get('role', 'viewer')}
        for u in mongo.db.users.find()
    ]
    return jsonify(users), 200

# ==========================
# 3. GET MATRIX
# ==========================
@auth.route('/matrix', methods=['GET'])
@jwt_required()
def get_matrix():
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))

    matrix_data = mongo.db.matrix.find_one({}, {"_id": 0}) or {}
    
    if user_role == 'viewer':
        viewer_permissions = {}
        for feature, roles in matrix_data.items():
            viewer_permissions[feature] = {"viewer": roles.get('viewer', False)}
        return jsonify(viewer_permissions)
    
    if user_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": f"Access denied. Role '{user_role}' cannot view matrix"}), 403

    return jsonify(matrix_data or {}), 200

# ==========================
# 4. UPDATE MATRIX
# ==========================
@auth.route('/update-matrix', methods=['POST'])
@jwt_required()
def update_matrix():
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))

    if user_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": f"Forbidden. Role '{user_role}' cannot update matrix"}), 403

    data = request.json
    feature = data.get("feature")
    target_role = normalize_role(data.get("role"))
    enabled = bool(data.get("enabled", False))

    if not feature or not target_role:
        return jsonify({"message": "Feature and role are required"}), 400

    if target_role == 'super_admin':
        return jsonify({"message": "Cannot modify Super Admin privileges"}), 403
    
    mongo.db.matrix.update_one(
        {},
        {"$set": {f"{feature}.{target_role}": enabled}},
        upsert=True
    )

    return jsonify({"message": f"Matrix updated: {feature}.{target_role} = {enabled}"}), 200

# ==========================
# 5. UPDATE USER ROLE (RBAC ENHANCED)
# ==========================
@auth.route('/update-user-role', methods=['POST'])
@jwt_required()
def update_user_role():
    """Enhanced user role update with RBAC validation."""
    claims = get_jwt()
    admin_role = normalize_role(claims.get("role"))
    current_user_id = claims.get("sub")  # Get current user ID from JWT

    if admin_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": f"Forbidden. Role '{admin_role}' cannot update users"}), 403

    data = request.json
    user_id = data.get("user_id")
    new_role = normalize_role(data.get("role"))

    if not user_id or not new_role:
        return jsonify({"message": "Both user_id and new role are required"}), 400

    target_user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        return jsonify({"message": "User not found"}), 404

    target_user_role = normalize_role(target_user.get('role'))

    # Enhanced RBAC validation
    can_modify, message = can_modify_role(
        admin_role, new_role, user_id, current_user_id
    )
    if not can_modify:
        return jsonify({"message": message}), 403

    # Log the role change for audit
    audit_log = {
        'timestamp': datetime.datetime.utcnow(),
        'event_type': 'role_change',
        'changed_by': current_user_id,
        'target_user': user_id,
        'old_role': target_user_role,
        'new_role': new_role,
        'changed_by_role': admin_role
    }
    mongo.db.audit_logs.insert_one(audit_log)

    # Update user role
    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role, "role_updated_at": datetime.datetime.utcnow()}}
    )

    return jsonify({
        "message": f"User role updated from '{target_user_role}' to '{new_role}' successfully",
        "old_role": target_user_role,
        "new_role": new_role,
        "updated_by": admin_role
    }), 200

# ==========================
# 6. REGISTER USER
# ==========================
@auth.route('/register', methods=['POST'])
@jwt_required()
def register():
    claims = get_jwt()
    creator_role = normalize_role(claims.get("role"))

    matrix = mongo.db.matrix.find_one({}, {"_id": 0}) or {}
    allowed = matrix.get("create_users", {}).get(creator_role, False)

    if not allowed:
        return jsonify({"message": "Forbidden: You cannot create users"}), 403

    data = request.json
    username = data.get('username')
    password = data.get('password')
    new_role = normalize_role(data.get('role', 'viewer'))

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    if mongo.db.users.find_one({"username": username}):
        return jsonify({"message": "Username already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    mongo.db.users.insert_one({
        "username": username,
        "password": hashed_password,
        "role": new_role,
        "createdAt": datetime.datetime.utcnow()
    })

    return jsonify({"message": "User created successfully"}), 201

# ==========================
# 7. INIT MATRIX
# ==========================
@auth.route('/init-matrix', methods=['GET'])
def init_matrix():
    """Initialize default access matrix in DB."""
    default_matrix = {
        "view_dashboard":    {"super_admin": True,  "business_admin": True,  "viewer": True},
        "calculate_taxes":   {"super_admin": True,  "business_admin": True,  "viewer": True},
        "search_vehicle_db": {"super_admin": True,  "business_admin": True,  "viewer": True},
        "add_vehicles":      {"super_admin": True,  "business_admin": True,  "viewer": False}, 
        "edit_vehicles":     {"super_admin": True,  "business_admin": True,  "viewer": False},
        "create_users":      {"super_admin": True,  "business_admin": True,  "viewer": False},
        "assign_user_roles": {"super_admin": True,  "business_admin": True,  "viewer": False}
    }
    mongo.db.matrix.replace_one({}, default_matrix, upsert=True)
    return jsonify({"message": "Matrix loaded successfully"}), 200

# ==========================
# 8. GET ROLE OPTIONS (RBAC ENHANCED)
# ==========================
@auth.route('/role-options', methods=['GET'])
@jwt_required()
def get_role_options():
    """Get available role options for current user."""
    claims = get_jwt()
    current_role = normalize_role(claims.get("role"))
    target_user_id = request.args.get('target_user_id')

    # Get target user role if specified
    target_user_role = None
    if target_user_id:
        target_user = mongo.db.users.find_one({"_id": ObjectId(target_user_id)})
        if target_user:
            target_user_role = target_user.get('role')

    # Get available options based on current user's role
    current_level = get_role_level(current_role)
    target_level = get_role_level(target_user_role) if target_user_role else 0

    options = []
    if current_level >= 3:  # Super Admin
        options = [
            {'value': 'viewer', 'label': 'Viewer', 'enabled': True},
            {'value': 'business_admin', 'label': 'Business Admin', 'enabled': True},
            {'value': 'super_admin', 'label': 'Super Admin', 'enabled': target_level < 3}
        ]
    elif current_level == 2:  # Business Admin
        options = [
            {'value': 'viewer', 'label': 'Viewer', 'enabled': True}
        ]
        if target_level == 1:  # Can promote Viewer to Business Admin
            options.append({'value': 'business_admin', 'label': 'Business Admin', 'enabled': True})
    else:  # Viewer
        options = [
            {'value': 'viewer', 'label': 'Viewer', 'enabled': False}
        ]

    return jsonify({
        "current_user_role": current_role,
        "target_user_role": target_user_role,
        "available_options": options
    }), 200

# ==========================
# 9. GET USER PERMISSIONS
# ==========================
@auth.route('/user-permissions', methods=['GET'])
@jwt_required()
def get_user_permissions():
    """Get current user's permissions."""
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))

    # Get user permissions from matrix
    matrix_data = mongo.db.matrix.find_one({}, {"_id": 0}) or {}
    permissions = {}
    
    for permission, roles in matrix_data.items():
        permissions[permission] = roles.get(user_role, False)

    return jsonify({
        "user_role": user_role,
        "permissions": permissions,
        "role_level": get_role_level(user_role)
    }), 200

from flask import Blueprint, jsonify, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from database import mongo
from bson.objectid import ObjectId
import datetime

auth = Blueprint('auth', __name__)
bcrypt = Bcrypt()

def normalize_role(role):
    """Normalize role to lowercase with underscores."""
    if not role:
        return "viewer"
    return role.lower().strip().replace(" ", "_")

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
# 5. UPDATE USER ROLE
# ==========================
@auth.route('/update-user-role', methods=['POST'])
@jwt_required()
def update_user_role():
    claims = get_jwt()
    admin_role = normalize_role(claims.get("role"))

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

    # Security rules
    if target_user_role == 'super_admin':
        return jsonify({"message": "Action Forbidden: Super Admin accounts cannot be modified."}), 403

    if admin_role == 'business_admin' and new_role == 'super_admin':
        return jsonify({"message": "Action Forbidden: Business Admins cannot create Super Admins."}), 403

    if admin_role == 'business_admin' and target_user_role == 'business_admin':
        return jsonify({"message": "Action Forbidden: Business Admins cannot modify other Business Admins."}), 403

    result = mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )

    return jsonify({"message": f"User role updated to '{new_role}' successfully"}), 200

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

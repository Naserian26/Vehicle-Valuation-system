from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from database import mongo
from bson.objectid import ObjectId
import datetime

# Attempt to import tax engine
try:
    from tax_engine import calculate_taxes
except ImportError:
    def calculate_taxes(crsp, cc, year):
        return {"error": "Tax Engine Missing"}

api = Blueprint("api", __name__)

# =========================
# RBAC HELPER FUNCTIONS
# =========================
def normalize_role(role):
    if not role or role.lower().strip() == "user":
        return "viewer"
    return role.lower().strip().replace(" ", "_")

def get_role_level(role):
    """Get hierarchy level for a role."""
    ROLE_HIERARCHY = {
        'viewer': 1,
        'business_admin': 2, 
        'super_admin': 3
    }
    normalized_role = normalize_role(role)
    return ROLE_HIERARCHY.get(normalized_role, 0)

def has_permission(feature, role):
    """Check the permissions matrix in MongoDB"""
    matrix = mongo.db.auth_matrix.find_one({}, {"_id": 0}) or {}
    return matrix.get(feature, {}).get(role, False)

def can_add_vehicle(role, year):
    """Check if user can add vehicles based on access matrix and year restrictions"""
    # Vehicle addition restricted to 2025 only
    if year != 2025:
        return False, "Vehicle addition is restricted to year 2025 only"
    
    # Check permission matrix
    if not has_permission('add_vehicles', role):
        return False, "You do not have permission to add vehicles"
    
    return True, "Vehicle addition allowed"

def validate_vehicle_action(role, action, vehicle_data=None):
    """Comprehensive vehicle action validation"""
    permissions = {
        'view': has_permission('search_vehicle_db', role),
        'add': has_permission('add_vehicles', role),
        'edit': has_permission('edit_vehicles', role),
        'delete': has_permission('edit_vehicles', role),
        'calculate_tax': has_permission('calculate_taxes', role)
    }
    
    if action not in permissions:
        return False, f"Unknown action: {action}"
    
    if not permissions[action]:
        return False, f"Permission denied for {action}"
    
    # Special validation for vehicle addition
    if action == 'add' and vehicle_data:
        year = vehicle_data.get('year')
        can_add, message = can_add_vehicle(role, year)
        if not can_add:
            return False, message
    
    return True, f"Action {action} allowed"

def can_edit_delete_vehicle(role):
    """Check if user can edit/delete vehicles based on access matrix"""
    role = normalize_role(role)
    
    # Check access matrix for edit_vehicles permission
    has_edit_permission = has_permission("edit_vehicles", role)
    
    # For backward compatibility, admins still have access
    if role in ["business_admin", "super_admin"]:
        return has_edit_permission
    
    # Other roles need explicit permission
    return has_edit_permission

# =========================
# 1. DASHBOARD STATS (RBAC ENHANCED)
# =========================
# =========================
# 1. DASHBOARD STATS (RBAC ENHANCED)
# =========================
@api.route("/dashboard-stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    try:
        claims = get_jwt()
        user_role = normalize_role(claims.get("role"))
        
        # 1. Create the aggregation pipeline for Top Vehicles
        # Groups by 'make', counts them, sorts descending, gets top 5
        pipeline = [
            {"$group": {"_id": "$make", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        
        # Execute the pipeline and convert the cursor to a list
        top_vehicles_cursor = mongo.db.vehicles.aggregate(pipeline)
        top_vehicles_list = list(top_vehicles_cursor)

        # 2. Basic stats available to all roles (now including top_vehicles)
        stats = {
            "total_vehicles": mongo.db.vehicles.count_documents({}),
            "vehicles_by_year": {
                "2025": mongo.db.vehicles.count_documents({"year": 2025}),
                "2020": mongo.db.vehicles.count_documents({"year": 2020})
            },
            "top_vehicles": top_vehicles_list # <--- Added here
        }
        
        # Admin-only stats
        if get_role_level(user_role) >= 2:
            stats.update({
                "total_users": mongo.db.users.count_documents({}),
                "users_by_role": {
                    "super_admin": mongo.db.users.count_documents({"role": "super_admin"}),
                    "business_admin": mongo.db.users.count_documents({"role": "business_admin"}),
                    "viewer": mongo.db.users.count_documents({"role": "viewer"})
                }
            })
        
        # Super Admin only stats
        if get_role_level(user_role) >= 3:
            stats.update({
                "recent_role_changes": list(mongo.db.audit_logs.find({
                    'event_type': 'role_change'
                }).sort('timestamp', -1).limit(5))
            })
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# 2. TAX CALCULATOR (RBAC ENHANCED)
# =========================
@api.route("/calculate", methods=["POST"])
@jwt_required()
def calculate():
    """Enhanced tax calculator with RBAC validation"""
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))
    
    # Check if user has permission to calculate taxes
    if not has_permission('calculate_taxes', user_role):
        return jsonify({"error": "Permission denied: You cannot calculate taxes"}), 403
    
    data = request.json or {}
    try:
        crsp = float(data.get("crsp", 0))
        cc = int(data.get("engineCc", 0))
        year = int(data.get("year", 2025))
        
        # Validate year restriction
        if year != 2025:
            return jsonify({"error": "Tax calculation only available for 2025 vehicles"}), 400
        
        result = calculate_taxes(crsp, cc, year)
        
        # Log tax calculation for audit
        audit_log = {
            'timestamp': datetime.datetime.utcnow(),
            'event_type': 'tax_calculation',
            'calculated_by': claims.get("sub"),
            'vehicle_data': {
                'crsp': crsp,
                'engine_cc': cc,
                'year': year
            },
            'result': result
        }
        mongo.db.audit_logs.insert_one(audit_log)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# 3. SEARCH VEHICLE (RBAC ENHANCED)
# =========================
@api.route("/search", methods=["GET"])
@jwt_required()
def search_vehicle():
    """Enhanced vehicle search with RBAC validation"""
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))
    
    # Check if user has permission to search vehicles
    if not has_permission('search_vehicle_db', user_role):
        return jsonify({"error": "Permission denied: You cannot search vehicles"}), 403
    
    year = request.args.get("year", "2025")
    make = request.args.get("make", "").strip()
    model = request.args.get("model", "").strip()
    engine = request.args.get("engine", "").strip()
    fuel = request.args.get("fuel", "").strip()
    
    try:
        query = {"year": int(year)}
        if make:
            query["make"] = {"$regex": make, "$options": "i"}
        if model:
            query["model"] = {"$regex": model, "$options": "i"}
        if engine:
            query["$or"] = query.get("$or", [])
            query["$or"].extend([
                {"engine_cc": {"$regex": engine, "$options": "i"}},
                {"engineCc": {"$regex": engine, "$options": "i"}},
                {"cc": {"$regex": engine, "$options": "i"}}
            ])
        if fuel:
            query["$or"] = query.get("$or", [])
            query["$or"].extend([
                {"fuel_type": {"$regex": fuel, "$options": "i"}},
                {"fuelType": {"$regex": fuel, "$options": "i"}}
            ])
        
        results = list(mongo.db.vehicles.find(query))
        for v in results:
            v["_id"] = str(v["_id"])
        
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# 4. GET VEHICLES (RBAC ENHANCED)
# =========================
@api.route("/vehicles", methods=["GET"])
@jwt_required()
def get_vehicles():
    """Enhanced vehicle listing with RBAC validation"""
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))
    
    # Check if user has permission to view vehicles
    if not has_permission('search_vehicle_db', user_role):
        return jsonify({"error": "Permission denied: You cannot view vehicles"}), 403
    
    try:
        page = int(request.args.get("page", 1))
        search = request.args.get("search", "")
        selected_year = request.args.get("year", "")
        limit = 20
        skip = (page - 1) * limit

        filters = []
        if selected_year:
            try:
                filters.append({"year": int(selected_year)})
            except ValueError:
                return jsonify({"error": "Invalid year"}), 400
        if search:
            filters.append({
                "$or": [
                    {"make": {"$regex": search, "$options": "i"}},
                    {"model": {"$regex": search, "$options": "i"}}
                ]
            })
        query = {"$and": filters} if filters else {}

        total = mongo.db.vehicles.count_documents(query)
        vehicles_cursor = (
            mongo.db.vehicles.find(query)
            .sort([("make", 1), ("model", 1)])
            .skip(skip)
            .limit(limit)
        )

        vehicle_list = []
        for v in vehicles_cursor:
            v["_id"] = str(v["_id"])
            vehicle_list.append(v)

        return jsonify({
            "vehicles": vehicle_list,
            "total": total,
            "pages": (total // limit) + (1 if total % limit > 0 else 0)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# 5. ADD VEHICLE
# =========================
@api.route("/vehicles", methods=["POST"])
@jwt_required()
def add_vehicle():
    try:
        role = normalize_role(get_jwt().get("role"))
        data = request.json or {}
        year = int(data.get("year", 2025))

        can_add, msg = can_add_vehicle(role, year)
        if not can_add:
            return jsonify({"message": f"Forbidden: {msg}"}), 403

        required_fields = ["make", "model", "crsp"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"message": f"Missing field: {field}"}), 400

        new_vehicle = {
            "make": str(data["make"]).upper(),
            "model": str(data["model"]).upper(),
            "engineCc": int(data.get("engineCc", 0)),
            "fuelType": data.get("fuelType", "GASOLINE"),
            "crsp": float(data["crsp"]),
            "year": 2025,
            "createdAt": datetime.datetime.utcnow(),
        }

        result = mongo.db.vehicles.insert_one(new_vehicle)
        new_vehicle["_id"] = str(result.inserted_id)
        return jsonify(new_vehicle), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# 6. UPDATE VEHICLE
# =========================
@api.route("/vehicles/<id>", methods=["PUT"])
@jwt_required()
def update_vehicle(id):
    try:
        role = normalize_role(get_jwt().get("role"))
        if not can_edit_delete_vehicle(role):
            return jsonify({"message": "Forbidden: Cannot edit vehicle"}), 403

        data = request.json or {}
        update_data = {
            "make": str(data.get("make", "")).upper(),
            "model": str(data.get("model", "")).upper(),
            "engineCc": int(data.get("engineCc", 0)),
            "fuelType": data.get("fuelType", "GASOLINE"),
            "crsp": float(data.get("crsp", 0)),
            "updatedAt": datetime.datetime.utcnow(),
        }

        result = mongo.db.vehicles.update_one({"_id": ObjectId(id)}, {"$set": update_data})
        if result.matched_count == 0:
            return jsonify({"message": "Vehicle not found"}), 404
        return jsonify({"message": "Vehicle updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# 7. DELETE VEHICLE
# =========================
@api.route("/vehicles/<id>", methods=["DELETE"])
@jwt_required()
def delete_vehicle(id):
    try:
        role = normalize_role(get_jwt().get("role"))
        if not can_edit_delete_vehicle(role):
            return jsonify({"message": "Forbidden: Cannot delete vehicle"}), 403

        result = mongo.db.vehicles.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 1:
            return jsonify({"message": "Vehicle deleted"}), 200
        return jsonify({"message": "Vehicle not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

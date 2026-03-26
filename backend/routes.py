from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request, get_jwt_identity
from database import mongo
from bson.objectid import ObjectId
import datetime
from cloudinary_helper import upload_photo, delete_photo

# Attempt to import tax engine
try:
    from tax_engine import calculate_taxes
except ImportError:
    def calculate_taxes(crsp, cc, year):
        return {"error": "Tax Engine Missing"}

api = Blueprint("api", __name__)

# =========================
# ✅ SESSION VALIDATOR
# =========================
@api.before_request
def validate_session():
    try:
        verify_jwt_in_request()
    except:
        return

    user_id = get_jwt_identity()
    current_token = request.headers.get('Authorization', '').replace('Bearer ', '')

    user = mongo.db.users.find_one(
        {"_id": ObjectId(user_id)},
        {"active_token": 1}
    )

    if not user or user.get('active_token') != current_token:
        return jsonify({"message": "Session expired. Please login again."}), 401

# =========================
# RBAC HELPER FUNCTIONS
# =========================
def normalize_role(role):
    if not role or role.lower().strip() == "user":
        return "viewer"
    return role.lower().strip().replace(" ", "_")

def get_role_level(role):
    ROLE_HIERARCHY = {
        'viewer': 1,
        'business_admin': 2,
        'super_admin': 3
    }
    normalized_role = normalize_role(role)
    return ROLE_HIERARCHY.get(normalized_role, 0)

def has_permission(feature, role):
    matrix = mongo.db.auth_matrix.find_one({}, {"_id": 0}) or {}
    return matrix.get(feature, {}).get(role, False)

def can_add_vehicle(role, year):
    if year != 2025:
        return False, "Vehicle addition is restricted to year 2025 only"
    if not has_permission('add_vehicles', role):
        return False, "You do not have permission to add vehicles"
    return True, "Vehicle addition allowed"

def can_edit_delete_vehicle(role):
    role = normalize_role(role)
    has_edit_permission = has_permission("edit_vehicles", role)
    if role in ["business_admin", "super_admin"]:
        return has_edit_permission
    return has_edit_permission

# =========================
# 1. DASHBOARD STATS
# =========================
@api.route("/dashboard-stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    try:
        claims = get_jwt()
        user_role = normalize_role(claims.get("role"))

        pipeline = [
            {"$group": {"_id": "$make", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]

        top_vehicles_list = list(mongo.db.vehicles.aggregate(pipeline))

        stats = {
            "total_vehicles": mongo.db.vehicles.count_documents({}),
            "vehicles_by_year": {
                "2025": mongo.db.vehicles.count_documents({"year": 2025}),
                "2020": mongo.db.vehicles.count_documents({"year": 2020})
            },
            "top_vehicles": top_vehicles_list
        }

        if get_role_level(user_role) >= 2:
            stats.update({
                "total_users": mongo.db.users.count_documents({}),
                "users_by_role": {
                    "super_admin": mongo.db.users.count_documents({"role": "super_admin"}),
                    "business_admin": mongo.db.users.count_documents({"role": "business_admin"}),
                    "viewer": mongo.db.users.count_documents({"role": "viewer"})
                }
            })

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
# 2. TAX CALCULATOR
# =========================
@api.route("/calculate", methods=["POST"])
@jwt_required()
def calculate():
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))

    if not has_permission('calculate_taxes', user_role):
        return jsonify({"error": "Permission denied: You cannot calculate taxes"}), 403

    data = request.json or {}
    try:
        crsp = float(data.get("crsp", 0))
        cc = int(data.get("engineCc", 0))
        year = int(data.get("year", 2025))

        if year != 2025:
            return jsonify({"error": "Tax calculation only available for 2025 vehicles"}), 400

        result = calculate_taxes(crsp, cc, year)

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
# 3. SEARCH VEHICLE
# =========================
@api.route("/search", methods=["GET"])
@jwt_required()
def search_vehicle():
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))

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
# 4. GET VEHICLES
# =========================
@api.route("/vehicles", methods=["GET"])
@jwt_required()
def get_vehicles():
    claims = get_jwt()
    user_role = normalize_role(claims.get("role"))

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

        # ✅ UPDATED: search now includes file_number and item_number
        if search:
            filters.append({
                "$or": [
                    {"make":        {"$regex": search, "$options": "i"}},
                    {"model":       {"$regex": search, "$options": "i"}},
                    {"file_number": {"$regex": search, "$options": "i"}},
                    {"item_number": {"$regex": search, "$options": "i"}},
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
        year = int(request.form.get("year", 2025))

        can_add, msg = can_add_vehicle(role, year)
        if not can_add:
            return jsonify({"message": f"Forbidden: {msg}"}), 403

        make  = request.form.get("make", "")
        model = request.form.get("model", "")
        crsp  = request.form.get("crsp", 0)

        if not make or not model or not crsp:
            return jsonify({"message": "Missing required fields"}), 400

        # ✅ UPDATED: now includes file_number and item_number
        new_vehicle = {
            "make":        str(make).upper(),
            "model":       str(model).upper(),
            "engineCc":    int(request.form.get("engineCc", 0)),
            "fuelType":    request.form.get("fuelType", "GASOLINE"),
            "crsp":        float(crsp),
            "year":        2025,
            "file_number": request.form.get("file_number", "").strip(),
            "item_number": request.form.get("item_number", "").strip(),
            "createdAt":   datetime.datetime.utcnow(),
            "photos":      []
        }

        # Handle photo upload if provided
        photo = request.files.get("photo")
        if photo:
            folder_name = f"{make}_{model}_{year}".replace(" ", "_")
            photo_url = upload_photo(photo, folder_name)
            if photo_url:
                new_vehicle["photos"] = [photo_url]

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

        # ✅ UPDATED: now includes file_number and item_number
        update_data = {
            "make":        str(data.get("make", "")).upper(),
            "model":       str(data.get("model", "")).upper(),
            "engineCc":    int(data.get("engineCc", 0)),
            "fuelType":    data.get("fuelType", "GASOLINE"),
            "crsp":        float(data.get("crsp", 0)),
            "file_number": data.get("file_number", "").strip(),
            "item_number": data.get("item_number", "").strip(),
            "updatedAt":   datetime.datetime.utcnow(),
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

        vehicle = mongo.db.vehicles.find_one({"_id": ObjectId(id)})
        if not vehicle:
            return jsonify({"message": "Vehicle not found"}), 404

        # Delete photos from Cloudinary
        for photo_url in vehicle.get("photos", []):
            public_id = "/".join(photo_url.split("/")[-3:]).split(".")[0]
            delete_photo(public_id)

        mongo.db.vehicles.delete_one({"_id": ObjectId(id)})
        return jsonify({"message": "Vehicle deleted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
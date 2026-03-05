from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client.vehicle_valuation

default_matrix = {
    "view_dashboard": {"super_admin": True, "business_admin": True, "viewer": True, "user": True},
    "calculate_taxes": {"super_admin": True, "business_admin": True, "viewer": True, "user": True},
    "add_vehicles": {"super_admin": True, "business_admin": True, "viewer": False, "user": False},
    "edit_vehicles": {"super_admin": True, "business_admin": True, "viewer": False, "user": False},
    "search_vehicle_db": {"super_admin": True, "business_admin": True, "viewer": True, "user": True},
    "create_users": {"super_admin": True, "business_admin": True, "viewer": False, "user": False},
    "assign_user_roles": {"super_admin": True, "business_admin": True, "viewer": False, "user": False}
}

db.auth_matrix.delete_many({}) # Clear any partial state
db.auth_matrix.insert_one(default_matrix)
print("✅ Auth Matrix initialized successfully.")

# Also check for any 'user' role accounts
users = list(db.users.find({}, {"email": 1, "role": 1}))
print(f"Current Users: {users}")

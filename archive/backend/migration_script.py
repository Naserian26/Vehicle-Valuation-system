from pymongo import MongoClient
import os

# Configuration (matching backend/config.py)
MONGO_URI = "mongodb://localhost:27017/vehicle_valuation"

client = MongoClient(MONGO_URI)
db = client.vehicle_valuation

def migrate_users():
    print("Starting migration...")
    
    # 1. Add must_change_password: True to all users who don't have it
    result = db.users.update_many(
        {"must_change_password": {"$exists": False}},
        {"$set": {"must_change_password": True}}
    )
    print(f"Updated {result.modified_count} users with must_change_password: True")

    # 2. Ensure super_admin doesn't have must_change_password: True
    result = db.users.update_many(
        {"role": "super_admin"},
        {"$set": {"must_change_password": False}}
    )
    print(f"Ensured {result.modified_count} Super Admins do NOT have forced password change.")

    # 3. For any user without an email field, use their username if it looks like an email or placeholder
    users_without_email = db.users.find({"email": {"$exists": False}})
    for user in users_without_email:
        username = user.get('username', '')
        # If username contains @, use it as email
        if '@' in username:
            db.users.update_one({"_id": user['_id']}, {"$set": {"email": username}})
        else:
            # Placeholder email
            db.users.update_one({"_id": user['_id']}, {"$set": {"email": f"{username}@example.com"}})
    
    print("Migration complete.")

if __name__ == "__main__":
    migrate_users()

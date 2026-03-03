"""
create_super_admin.py
----------------------
Creates Super Admin in vehicle_valuation database.

Usage:
    python create_super_admin.py
"""

import sys
from datetime import datetime
from pymongo import MongoClient
import bcrypt

# ──────────────────────────────────────────────
MONGO_URI = "mongodb://localhost:27017"
DB_NAME   = "vehicle_valuation"

NEW_EMAIL    = "mangokamercy26@gmail.com"
NEW_PASSWORD = "Admin@123"
# ──────────────────────────────────────────────


def main():
    print("=" * 50)
    print("  Super Admin Creator — vehicle_valuation")
    print("=" * 50)

    # Connect
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        client.server_info()
        db = client[DB_NAME]
        print(f"✅ Connected to '{DB_NAME}'")
    except Exception as e:
        print(f"❌ Could not connect to MongoDB: {e}")
        print("   Make sure MongoDB is running.")
        sys.exit(1)

    users = db["users"]

    # Show current users
    current = list(users.find({}, {"email": 1, "role": 1, "_id": 0}))
    print(f"\n📋 Current users in '{DB_NAME}': {current}")

    # Remove any existing super_admin
    deleted = users.delete_many({"role": "super_admin"})
    if deleted.deleted_count:
        print(f"🗑️  Removed {deleted.deleted_count} old super_admin(s).")

    # Hash password
    hashed = bcrypt.hashpw(NEW_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Insert new super admin
    new_admin = {
        "email": NEW_EMAIL,
        "password": hashed,
        "role": "super_admin",
        "must_change_password": False,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = users.insert_one(new_admin)

    if result.inserted_id:
        print(f"\n✅ Super Admin created successfully!")
        print(f"   Database : {DB_NAME}")
        print(f"   Email    : {NEW_EMAIL}")
        print(f"   Password : {NEW_PASSWORD}")
        print(f"   Role     : super_admin")
        print(f"   ID       : {result.inserted_id}")
    else:
        print("❌ Failed to create. Try again.")
        sys.exit(1)

    # Final verify
    verify = users.find_one({"role": "super_admin"}, {"email": 1, "role": 1, "_id": 0})
    print(f"\n📋 Verified: {verify}")
    print("\n🎉 Log in with:")
    print(f"   Email    : {NEW_EMAIL}")
    print(f"   Password : {NEW_PASSWORD}")
    print("=" * 50)


if __name__ == "__main__":
    main()
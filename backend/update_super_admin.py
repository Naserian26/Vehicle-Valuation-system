"""
update_super_admin.py
---------------------
Updates the Super Admin email (and optionally password) in MongoDB.

Usage:
    python update_super_admin.py
"""

import sys
from pymongo import MongoClient
import bcrypt

# ──────────────────────────────────────────────
# CONFIG — change DB name if yours is different
# ──────────────────────────────────────────────
MONGO_URI = "mongodb://localhost:27017"
DB_NAME   = "fleet"          # ← change if needed (run `show dbs` in mongosh to check)

NEW_EMAIL    = "mangokamercy26@gmail.com"
NEW_PASSWORD = None          # Set to a string like "MyNewPass@1" to also change password
                             # Leave as None to keep the existing password unchanged

# ──────────────────────────────────────────────

def main():
    print("=" * 50)
    print("  Super Admin Updater")
    print("=" * 50)

    # Connect to MongoDB
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        client.server_info()  # will throw if cannot connect
        db = client[DB_NAME]
        print(f"✅ Connected to MongoDB — database: '{DB_NAME}'")
    except Exception as e:
        print(f"❌ Could not connect to MongoDB: {e}")
        print("\nMake sure MongoDB is running:  sudo systemctl start mongod")
        sys.exit(1)

    users = db["users"]

    # Find existing super admin
    admin = users.find_one({"role": "super_admin"})
    if not admin:
        print("❌ No super_admin user found in the database.")
        print("   Run your reset_admin.py first to create one.")
        sys.exit(1)

    print(f"\n📋 Found super admin:")
    print(f"   Current email : {admin.get('email')}")
    print(f"   Role          : {admin.get('role')}")

    # Build the update payload
    update_fields = {"email": NEW_EMAIL}

    if NEW_PASSWORD:
        hashed = bcrypt.hashpw(NEW_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        update_fields["password"] = hashed
        print(f"\n🔑 Password will also be updated.")

    # Apply the update
    result = users.update_one(
        {"role": "super_admin"},
        {"$set": update_fields}
    )

    if result.modified_count == 1:
        print(f"\n✅ Success! Super admin updated.")
        print(f"   New email : {NEW_EMAIL}")
        if NEW_PASSWORD:
            print(f"   Password  : {NEW_PASSWORD}")
        else:
            print(f"   Password  : unchanged (still Admin@123)")
    else:
        print("\n⚠️  No changes were made (email may already be set to that value).")

    # Verify
    updated = users.find_one({"role": "super_admin"})
    print(f"\n📋 Verified in DB:")
    print(f"   Email : {updated.get('email')}")
    print(f"   Role  : {updated.get('role')}")
    print("\n🎉 You can now log in with:")
    print(f"   Email    : {NEW_EMAIL}")
    print(f"   Password : {NEW_PASSWORD if NEW_PASSWORD else 'Admin@123'}")
    print("=" * 50)


if __name__ == "__main__":
    main()
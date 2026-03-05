from pymongo import MongoClient

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.vehicle_valuation
    
    # Delete the existing business admin user to test fresh registration
    result = db.users.delete_one({"email": "mmangoka@kabarak.ac.ke"})
    
    if result.deleted_count > 0:
        print(f"✅ Deleted existing user: mmangoka@kabarak.ac.ke")
        print(f"Now try the registration link again:")
        print(f"http://localhost:5173/register?token=SfS3tzKeUidWB6rtmXX-VhXkftUaYT2FZUHxgffZr1g")
        print(f"\nThe backend console will show the actual password sent.")
        print(f"Use that exact password to login.")
    else:
        print(f"❌ User not found or already deleted")
        
    # Also reset the invite to unused
    invite_result = db.invites.update_one(
        {"token": "SfS3tzKeUidWB6rtmXX-VhXkftUaYT2FZUHxgffZr1g"},
        {"$set": {"used": False}}
    )
    
    if invite_result.modified_count > 0:
        print(f"✅ Reset invite to unused")
    
except Exception as e:
    print(f"Error: {e}")

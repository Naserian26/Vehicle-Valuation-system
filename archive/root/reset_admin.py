from pymongo import MongoClient
from flask_bcrypt import Bcrypt

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.vehicle_valuation
    bcrypt = Bcrypt()
    
    hashed = bcrypt.generate_password_hash("Admin@123").decode("utf-8")
    
    res = db.users.update_one(
        {"role": "super_admin"},
        {"$set": {"password": hashed, "must_change_password": True}}
    )
    
    if res.matched_count > 0:
        print(f"✅ Reset successful for Super Admin. (Modified: {res.modified_count})")
    else:
        print("❌ No Super Admin account found in database.")
        
except Exception as e:
    print(f"❌ Error: {e}")

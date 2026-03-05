from pymongo import MongoClient
from flask_bcrypt import Bcrypt

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.vehicle_valuation
    bcrypt = Bcrypt()
    
    # Set a known temporary password
    temp_password = "TempPass123!"
    hashed_password = bcrypt.generate_password_hash(temp_password).decode("utf-8")
    
    result = db.users.update_one(
        {"email": "mmangoka@kabarak.ac.ke"},
        {"$set": {
            "password": hashed_password,
            "must_change_password": True
        }}
    )
    
    if result.modified_count > 0:
        print(f"✅ Password reset successful!")
        print(f"Email: mmangoka@kabarak.ac.ke")
        print(f"Temporary Password: {temp_password}")
        print(f"Role: business_admin")
        print("\nUse these credentials to login, then you'll be prompted to change password.")
    else:
        print("❌ User not found or no changes made")
        
except Exception as e:
    print(f"Error: {e}")

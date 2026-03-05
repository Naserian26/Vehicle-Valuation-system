from pymongo import MongoClient
from flask_bcrypt import Bcrypt

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.vehicle_valuation
    bcrypt = Bcrypt()
    
    # Find the business admin user
    user = db.users.find_one({"email": "mmangoka@kabarak.ac.ke"})
    
    if user:
        print(f"✅ User found:")
        print(f"Email: {user.get('email')}")
        print(f"Role: {user.get('role')}")
        print(f"Must change password: {user.get('must_change_password')}")
        print(f"Created: {user.get('createdAt')}")
        
        # Test password verification
        test_passwords = ["Admin@123", "Temp123!", "temp123", "password"]
        
        for pwd in test_passwords:
            try:
                result = bcrypt.check_password_hash(user['password'], pwd)
                print(f"Password '{pwd}': {'✅ Valid' if result else '❌ Invalid'}")
            except Exception as e:
                print(f"Password '{pwd}': ❌ Error - {e}")
    else:
        print("❌ User not found")
        
        # Check all users with similar email
        users = list(db.users.find({"email": {"$regex": "mmangoka"}}))
        print(f"\nFound {len(users)} users with 'mmangoka' in email:")
        for u in users:
            print(f"- {u.get('email')} ({u.get('role')})")
    
except Exception as e:
    print(f"Error: {e}")

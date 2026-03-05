from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client.vehicle_valuation

user = db.users.find_one({"role": "super_admin"})
if user:
    email = user.get('email')
    print(f"EXACT_SUPER_ADMIN_EMAIL: {email}")
    print(f"LENGTH: {len(email)}")
else:
    print("NO_SUPER_ADMIN_FOUND")

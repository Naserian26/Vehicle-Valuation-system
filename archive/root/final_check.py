from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client.vehicle_valuation

print("--- ALL USERS ---")
for user in db.users.find({}, {"password": 0}):
    print(f"Email: '{user.get('email')}' | Role: {user.get('role')}")

print("\n--- ALL INVITES ---")
for invite in db.invites.find({}):
    print(f"Email: '{invite.get('email')}' | Token: {invite.get('token')} | Used: {invite.get('used')}")

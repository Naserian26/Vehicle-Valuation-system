from pymongo import MongoClient
import json
from bson import json_util

client = MongoClient("mongodb://localhost:27017/")
db = client.vehicle_valuation

print("--- MATRIX ---")
matrix = db.matrix.find_one({}, {"_id": 0})
print(json.dumps(matrix, default=json_util.default, indent=2))

print("\n--- USERS ---")
users = list(db.users.find({}, {"_id": 0, "password": 0}))
print(json.dumps(users, default=json_util.default, indent=2))

print("\n--- VEHICLES (FIRST 2) ---")
vehicles = list(db.vehicles.find().limit(2))
print(json.dumps(vehicles, default=json_util.default, indent=2))

print("\n--- VEHICLE COUNT BY YEAR ---")
years = db.vehicles.distinct("year")
for y in years:
    count = db.vehicles.count_documents({"year": y})
    print(f"Year {y}: {count} vehicles")

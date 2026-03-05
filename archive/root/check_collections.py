from pymongo import MongoClient
import json
from bson import json_util

client = MongoClient("mongodb://localhost:27017/")
db = client.vehicle_valuation

print("--- MATRIX COLLECTION ---")
print(json.dumps(db.matrix.find_one({}, {"_id": 0}), default=json_util.default, indent=2))

print("\n--- AUTH_MATRIX COLLECTION ---")
print(json.dumps(db.auth_matrix.find_one({}, {"_id": 0}), default=json_util.default, indent=2))

print("\n--- COLLECTIONS LIST ---")
print(db.list_collection_names())

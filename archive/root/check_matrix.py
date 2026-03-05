from pymongo import MongoClient
import json
from bson import json_util

client = MongoClient("mongodb://localhost:27017/")
db = client.vehicle_valuation
matrix = db.matrix.find_one({}, {"_id": 0})

print("Matrix Permissions:")
print(json.dumps(matrix, default=json_util.default, indent=2))

# Also check users
users = list(db.users.find({}, {"_id": 0, "password": 0}))
print("\nUsers List:")
print(json.dumps(users, default=json_util.default, indent=2))

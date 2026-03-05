from pymongo import MongoClient
import json
from bson import json_util

client = MongoClient("mongodb://localhost:27017/")
db = client.vehicle_valuation
vehicles = list(db.vehicles.find().limit(5))

print(json.dumps(vehicles, default=json_util.default, indent=2))

from flask import Flask
from flask_pymongo import PyMongo
import json
from bson import ObjectId
from datetime import datetime

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/vehicle_valuation"
mongo = PyMongo(app)

with app.app_context():
    email = "naserianmercy20@gmail.com"
    user = mongo.db.users.find_one({"email": email}, {"password": 0})
    print(f"USER_FOUND: {user is not None}")
    if user:
        print("START_JSON")
        print(json.dumps(user, cls=JSONEncoder, indent=2))
        print("END_JSON")

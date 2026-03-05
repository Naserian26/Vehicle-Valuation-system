from flask import Flask
from flask_pymongo import PyMongo
import json

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/vehicle_valuation"
mongo = PyMongo(app)

with app.app_context():
    matrix = mongo.db.matrix.find_one({}, {"_id": 0})
    print("START_MATRIX")
    print(json.dumps(matrix, indent=2))
    print("END_MATRIX")

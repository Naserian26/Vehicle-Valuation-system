from flask import Flask
from flask_pymongo import PyMongo

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/vehicle_valuation"
mongo = PyMongo(app)

with app.app_context():
    total = mongo.db.vehicles.count_documents({})
    v2025 = mongo.db.vehicles.count_documents({"year": 2025})
    v2020 = mongo.db.vehicles.count_documents({"year": 2020})
    
    # Try string years too if they were imported as strings
    s2025 = mongo.db.vehicles.count_documents({"year": "2025"})
    s2020 = mongo.db.vehicles.count_documents({"year": "2020"})
    
    print(f"Total vehicles: {total}")
    print(f"Year 2025 (int): {v2025}")
    print(f"Year 2020 (int): {v2020}")
    print(f"Year 2025 (str): {s2025}")
    print(f"Year 2020 (str): {s2020}")
    
    # Check collections
    print(f"Collections: {mongo.db.list_collection_names()}")

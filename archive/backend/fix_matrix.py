from flask import Flask
from flask_pymongo import PyMongo

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/vehicle_valuation"
mongo = PyMongo(app)

with app.app_context():
    # Features that should be accessible to everyone for viewing
    features = ['search_vehicle_db', 'view_dashboard']
    roles = ['super_admin', 'business_admin', 'viewer']
    
    matrix = mongo.db.matrix.find_one({}, {"_id": 0}) or {}
    
    for feature in features:
        if feature not in matrix:
            matrix[feature] = {}
        for role in roles:
            matrix[feature][role] = True
            
    mongo.db.matrix.update_one({}, {"$set": matrix}, upsert=True)
    print("Matrix updated: search_vehicle_db and view_dashboard set to True for all roles.")

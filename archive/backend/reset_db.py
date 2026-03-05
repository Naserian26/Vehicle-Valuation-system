from flask import Flask
from flask_pymongo import PyMongo

app = Flask(__name__)
# This must match your app.py URI exactly
app.config["MONGO_URI"] = "mongodb+srv://Naserian:2626@cluster0.tafbnws.mongodb.net/vehicle_valuation?retryWrites=true&w=majority"
mongo = PyMongo(app)

with app.app_context():
    # Count the vehicles
    count = mongo.db.vehicles.count_documents({})
    print(f"\n--- FOUND {count} VEHICLES ---")

    if count > 0:
        confirm = input("⚠️  Type 'DELETE' to wipe all 7,718 vehicles: ")
        if confirm == 'DELETE':
            mongo.db.vehicles.delete_many({})
            print("✅ Database wiped. It is now empty.")
        else:
            print("❌ Cancelled.")
    else:
        print("Database is already empty.")
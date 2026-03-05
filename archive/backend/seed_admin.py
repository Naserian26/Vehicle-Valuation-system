from flask import Flask
from flask_bcrypt import Bcrypt
from database import mongo

app = Flask(__name__)

# --- FIX: You MUST include the database name in the URI ---
# Change 'vehicle_valuation' to whatever you named your DB in Compass
app.config["MONGO_URI"] = "mongodb://localhost:27017/vehicle_valuation"
app.config["SECRET_KEY"] = "keval_secure_secret_key"

mongo.init_app(app)
bcrypt = Bcrypt(app)

def seed_admin():
    with app.app_context():
        # Safety check: Ensure db is connected
        if mongo.db is None:
            print("❌ Error: Could not connect to MongoDB. Is the service running?")
            return

        # 1. Check if Admin exists
        if mongo.db.users.find_one({"username": "SuperAdmin"}):
            print("⚠️  SuperAdmin already exists.")
        else:
            # 2. Create Admin
            hashed_pw = bcrypt.generate_password_hash("admin123").decode('utf-8')
            admin = {
                "username": "SuperAdmin",
                "password": hashed_pw,
                "role": "super_admin",
                "status": "Active" # Match the status field your UI expects
            }
            mongo.db.users.insert_one(admin)
            print("✅ Super Admin Created! (User: SuperAdmin / Pass: admin123)")

if __name__ == "__main__":
    seed_admin()
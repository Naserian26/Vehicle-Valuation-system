import os
from flask import Flask
from flask_cors import CORS
from database import mongo
from routes import api
from auth import auth
from rbac_auth import auth as rbac_auth
from admin import admin
from config import Config
from extensions import mail, jwt, bcrypt  # ← added bcrypt

app = Flask(__name__)
app.config.from_object(Config)

# --- 2. INITIALIZE ---
mongo.init_app(app)
mail.init_app(app)
jwt.init_app(app)
bcrypt.init_app(app)  # ← added

# --- 3. GLOBAL SETTINGS ---
app.url_map.strict_slashes = False

# --- 4. CORS ---
CORS(app, resources={
    r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]},
    r"/api/auth/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}
}, supports_credentials=True)

# --- 5. REGISTER BLUEPRINTS ---
app.register_blueprint(auth,      url_prefix='/api/auth')
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(rbac_auth, url_prefix='/api/auth')
app.register_blueprint(admin, url_prefix='/api/admin')

# --- 6. HEALTH CHECK ---
@app.route('/health')
def health_check():
    return {
        "status": "backend is running",
        "database": "offline/local",
        "rbac_system": "enhanced",
        "endpoints": {
            "api": "/api",
            "auth": "/api/auth",
            "vehicles": "/api/vehicles",
            "admin": "/api/admin"
        }
    }, 200

# --- 7. STARTUP CLEANUP ---
def clear_expired_tokens():
    """Clear expired active tokens on startup"""
    from flask_jwt_extended import decode_token
    try:
        users = list(mongo.db.users.find(
            {"active_token": {"$exists": True}},
            {"_id": 1, "active_token": 1}
        ))
        cleared = 0
        for u in users:
            try:
                decode_token(u['active_token'])
                # Token still valid — keep it
            except Exception:
                # Token expired — clear it
                mongo.db.users.update_one(
                    {"_id": u["_id"]},
                    {"$unset": {"active_token": ""}}
                )
                cleared += 1
        print(f"✅ Cleared {cleared} expired token(s) on startup")
    except Exception as e:
        print(f"[STARTUP] Token cleanup error: {e}")

if __name__ == '__main__':
    with app.app_context():
        clear_expired_tokens()

    print("\n" + "="*50)
    print(" KEVAL SYSTEMS BACKEND ACTIVE")
    print(" LOCAL URL: http://localhost:5000")
    print(" DB URL: mongodb://localhost:27017")
    print("="*50 + "\n")
    app.run(debug=Config.DEBUG, port=5000)
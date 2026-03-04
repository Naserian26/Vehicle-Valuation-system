import os

from flask import Flask

from flask_cors import CORS

from database import mongo

from routes import api

from auth import auth

from rbac_auth import auth as rbac_auth

from admin import admin

from flask_jwt_extended import JWTManager
from flask_mail import Mail
from config import Config

app = Flask(__name__)
app.config.from_object(Config)



# --- 2. INITIALIZE ---

mongo.init_app(app)

jwt = JWTManager(app)
mail = Mail(app)



# --- 3. GLOBAL SETTINGS ---

app.url_map.strict_slashes = False



# --- 4. CORS ---

CORS(app, resources={

    r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]},

    r"/api/auth/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}

}, supports_credentials=True)



# --- 5. REGISTER BLUEPRINTS ---

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



if __name__ == '__main__':

    print("\n" + "="*50)

    print(" KEVAL SYSTEMS BACKEND ACTIVE")

    print(" LOCAL URL: http://localhost:5000")

    print(" DB URL: mongodb://localhost:27017")

    print("="*50 + "\n")

    app.run(debug=Config.DEBUG, port=5000)
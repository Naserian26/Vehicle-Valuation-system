import os

class Config:
    # --- DATABASE CONFIGURATION ---
    # LOCAL: Use this when working without internet (MongoDB Compass must be running)
    LOCAL_URI = "mongodb://localhost:27017/vehicle_valuation"
    
    # CLOUD: Your MongoDB Atlas connection
    CLOUD_URI = "mongodb+srv://Naserian:2626@cluster0.tafbnws.mongodb.net/vehicle_valuation?retryWrites=true&w=majority"

    # Set this to True to work offline, False to work online
    OFFLINE_MODE = True 

    # Logic to pick the URI
    MONGO_URI = LOCAL_URI if OFFLINE_MODE else CLOUD_URI

    # --- SECURITY ---
    SECRET_KEY = os.environ.get("SECRET_KEY", "keval_secure_secret_key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-keval-key")
    
    # --- APP SETTINGS ---
    DEBUG = True

    # --- MAIL CONFIGURATION ---
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 465
    MAIL_USE_TLS = False
    MAIL_USE_SSL = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "info@calc.com")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "wusd oihe mzav akue")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "info@calc.com")
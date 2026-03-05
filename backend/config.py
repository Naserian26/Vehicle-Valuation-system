import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Config:
    # --- DATABASE CONFIGURATION ---
    LOCAL_URI  = os.environ.get("LOCAL_MONGO_URI",  "mongodb://localhost:27017/vehicle_valuation")
    CLOUD_URI  = os.environ.get("CLOUD_MONGO_URI",  "")
    OFFLINE_MODE = os.environ.get("OFFLINE_MODE", "true").lower() == "true"
    MONGO_URI  = LOCAL_URI if OFFLINE_MODE else CLOUD_URI

    # --- SECURITY ---
    SECRET_KEY     = os.environ.get("SECRET_KEY",     "keval_secure_secret_key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-keval-key")

    # --- APP SETTINGS ---
    DEBUG = True

    # --- MAIL CONFIGURATION ---
    MAIL_SERVER       = 'smtp.gmail.com'
    MAIL_PORT         = 465
    MAIL_USE_TLS      = False
    MAIL_USE_SSL      = True
    MAIL_USERNAME     = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD     = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER")
from database import mongo
from app import app

with app.app_context():
    result = mongo.db.users.update_many({}, {"$unset": {"active_token": ""}})
    print(f"Cleared active_token for {result.modified_count} users ✅")
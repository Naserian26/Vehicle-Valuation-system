"""
check_mongo.py
--------------
Shows all databases and collections in your MongoDB.
Run this to find the correct database name.
"""

from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)

print("=" * 50)
print("  MongoDB Inspector")
print("=" * 50)

# List all databases
dbs = client.list_database_names()
print(f"\n📦 All Databases found: {dbs}\n")

# For each database, show collections and user count
for db_name in dbs:
    if db_name in ["admin", "local", "config"]:
        continue  # skip system DBs
    db = client[db_name]
    collections = db.list_collection_names()
    print(f"🗄️  Database: '{db_name}'")
    print(f"   Collections: {collections}")
    
    # If users collection exists, show what's in it
    if "users" in collections:
        users = list(db["users"].find({}, {"email": 1, "role": 1, "_id": 0}))
        print(f"   Users: {users}")
    print()

print("=" * 50)
print("Copy the correct database name and tell me!")
print("=" * 50)
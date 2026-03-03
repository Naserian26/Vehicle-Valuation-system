from flask_pymongo import PyMongo

# Initialize the instance, but don't connect yet (we do that in app.py)
mongo = PyMongo()
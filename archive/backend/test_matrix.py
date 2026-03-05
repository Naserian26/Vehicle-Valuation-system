from flask import Flask
from database import mongo
from app import Config

app = Flask(__name__)
app.config.from_object(Config)
mongo.init_app(app)

# Get current matrix
matrix = mongo.db.matrix.find_one({}, {'_id': 0})
print('Current matrix in database:')
for key, value in matrix.items():
    print(f'  {key}: {value}')

# Check specifically for add_vehicles
add_vehicles = matrix.get('add_vehicles', {})
print(f'\nadd_vehicles permissions:')
for role, permission in add_vehicles.items():
    print(f'  {role}: {permission}')

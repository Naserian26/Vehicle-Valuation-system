import pandas as pd
from flask import Flask
from flask_pymongo import PyMongo
import re

app = Flask(__name__)
# Database Name
app.config["MONGO_URI"] = "mongodb://localhost:27017/vehicle_valuation"
mongo = PyMongo(app)

file_path = 'vehicles.xlsx'

def clean_cc(value):
    """Clean CC value to extract number."""
    if pd.isna(value): return 0
    str_val = str(value).lower()
    # Remove 'cc', 'kwh', etc.
    # numeric_part = re.sub(r'[^\d.]', '', str_val)
    # Extract first number found
    match = re.search(r'(\d+(\.\d+)?)', str_val)
    if match:
        try:
            return int(float(match.group(1)))
        except:
            return 0
    return 0

def import_data():
    try:
        print("Reading Excel file...")
        # Use header=1 based on previous output seeing columns there
        # Let's try to inspect columns again or just try find appropriate one
        df = pd.read_excel(file_path, header=None)
        
        # Find header row
        header_row_index = -1
        for i, row in df.iterrows():
            row_str = " ".join([str(x) for x in row.tolist()]).lower()
            if "make" in row_str and "model" in row_str:
                header_row_index = i
                break
        
        if header_row_index == -1:
            print("Could not find header row.")
            return

        print(f"Header found at row {header_row_index}")
        df = pd.read_excel(file_path, header=header_row_index)
        
        # Normalize column names
        df.columns = [str(c).replace('\n', ' ').strip() for c in df.columns]
        print("Columns:", df.columns.tolist())

        vehicles_to_insert = []
        for index, row in df.iterrows():
            if pd.isna(row.get('Make')): continue
            
            # Identify correct CC column
            cc_col = 'Engine Capacity' if 'Engine Capacity' in df.columns else 'CC'
            if cc_col not in df.columns:
                print("CC Column not found")
                break
                
            cc_raw = row.get(cc_col)
            cc_val = clean_cc(cc_raw)
            
            crsp_col = 'CRSP (KES.)'
            crsp_val = 0
            if crsp_col in df.columns:
                crsp_val = row.get(crsp_col)
                if pd.isna(crsp_val): crsp_val = 0
            
            vehicle = {
                "make": str(row.get('Make')).upper().strip(),
                "model": str(row.get('Model')).upper().strip(),
                "engine_cc": cc_val,
                "engineCc": cc_val,
                "cc": cc_val,
                "fuel_type": str(row.get('Fuel')).upper().strip() if pd.notna(row.get('Fuel')) else "GASOLINE",
                "fuelType": str(row.get('Fuel')).upper().strip() if pd.notna(row.get('Fuel')) else "GASOLINE",
                "crsp_value": float(crsp_val),
                "year": 2025
            }
            vehicles_to_insert.append(vehicle)
            
        print(f"Prepared {len(vehicles_to_insert)} vehicles.")
        
        if not vehicles_to_insert:
            print("No vehicles to insert.")
            return

        with app.app_context():
            print("Deleting existing records...")
            mongo.db.vehicles.delete_many({})
            print("Inserting new records...")
            mongo.db.vehicles.insert_many(vehicles_to_insert)
            print("Done!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import_data()

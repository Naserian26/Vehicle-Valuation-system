
import pandas as pd
from pymongo import MongoClient
import os

# --- 1. CONFIGURATION ---
# Correct connection string for your 'Naserian' account
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "vehicle_valuation"
FILENAME = "vehicles.xlsx" 

def get_database():
    client = MongoClient(MONGO_URI)
    return client[DB_NAME]

def clean_currency(value):
    """Removes commas/text and converts to float."""
    if pd.isna(value) or value == '':
        return 0.0
    try:
        clean_str = str(value).replace(',', '').strip()
        import re
        numbers = re.findall(r"[\d\.]+", clean_str)
        if numbers:
            return float(numbers[-1]) 
        return 0.0
    except:
        return 0.0

def import_excel():
    if not os.path.exists(FILENAME):
        print(f"❌ Error: Could not find '{FILENAME}' in the backend folder.")
        return

    print(f"📂 Reading {FILENAME}...")
    db = get_database()
    
    try:
        xls = pd.ExcelFile(FILENAME)
        print(f"   Found sheets: {xls.sheet_names}")
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return

    # --- PROCESS 2020 DATA ---
    if "CRSP 2020" in xls.sheet_names:
        print("🔹 Importing 2020 Data...")
        df20 = pd.read_excel(xls, "CRSP 2020", header=0)
        
        vehicles_2020 = []
        for _, row in df20.iterrows():
            try:
                v = {
                    "make": str(row.get('MAKE', '')).strip(),
                    "model": str(row.get('MODEL', '')).strip(),
                    "bodyType": str(row.get('BODY', '')).strip(),
                    "fuelType": str(row.get('FUEL', '')).strip(),
                    "engineCc": int(row['CAPACITY']) if pd.notna(row.get('CAPACITY')) else 0,
                    "driveType": str(row.get('DRIVE', '')).strip(),
                    "crsp": clean_currency(row.get('SELLING PRICE', 0)),
                    "year": 2020
                }
                # Only add if it has a Make and a Price
                if v['make'] and v['make'].lower() != 'nan' and v['crsp'] > 0:
                    vehicles_2020.append(v)
            except:
                continue
        
        if vehicles_2020:
            db.vehicles.delete_many({"year": 2020})
            db.vehicles.insert_many(vehicles_2020)
            print(f"   ✅ SUCCESS: Added {len(vehicles_2020)} vehicles for 2020.")
    else:
        print("⚠️ Sheet 'CRSP 2020' not found. Check your Excel tabs.")

    # --- PROCESS 2025 DATA ---
    if "CRSP 2025" in xls.sheet_names:
        print("🔹 Importing 2025 Data...")
        # 2025 headers are on row 2 (index 1)
        df25 = pd.read_excel(xls, "CRSP 2025", header=1)
        
        vehicles_2025 = []
        for _, row in df25.iterrows():
            try:
                # Helper to find columns loosely (e.g. "Model" or "Model Name")
                def get_val(col_name_part):
                    for col in df25.columns:
                        if col_name_part.lower() in str(col).lower():
                            return row[col]
                    return None

                cc_val = get_val("Capacity")
                cc = 0
                if pd.notna(cc_val):
                    try: cc = int(float(str(cc_val).replace(',','')))
                    except: pass
                
                v = {
                    "make": str(get_val("Make")).strip(),
                    "model": str(get_val("Model")).strip(),
                    "bodyType": str(get_val("Body")).strip(),
                    "fuelType": str(get_val("Fuel")).strip(),
                    "engineCc": cc,
                    "year": 2025,
                    "crsp": clean_currency(get_val("CRSP"))
                }

                if v['make'] and v['make'].lower() != 'nan' and v['crsp'] > 0:
                    vehicles_2025.append(v)
            except:
                continue

        if vehicles_2025:
            db.vehicles.delete_many({"year": 2025})
            db.vehicles.insert_many(vehicles_2025)
            print(f"   ✅ SUCCESS: Added {len(vehicles_2025)} vehicles for 2025.")
    else:
        print("⚠️ Sheet 'CRSP 2025' not found. Check your Excel tabs.")

if __name__ == "__main__":
    import_excel()
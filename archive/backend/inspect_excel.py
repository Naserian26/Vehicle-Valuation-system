import pandas as pd
import json

file_path = 'vehicles.xlsx'

try:
    df = pd.read_excel(file_path, header=None, nrows=10)
    data = []
    for index, row in df.iterrows():
        # Clean NaNs effectively for JSON
        cleaned_row = [x if pd.notna(x) else None for x in row.tolist()]
        data.append({"index": index, "row": cleaned_row})
    
    print("JSON_START")
    print(json.dumps(data, indent=2))
    print("JSON_END")
except Exception as e:
    print(f"Error: {e}")

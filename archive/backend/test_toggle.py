import requests
import json

# Test toggling Business Admin edit_vehicles permission to OFF
url = "http://localhost:5000/api/auth/update-matrix"
headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6dHJ1ZSwiaWF0IjoxNzM5NzAzMjAwLCJuYmYiOjE3Mzk3MDMyMDAsImV4cCI6MTczOTcwNjgwMCwic3ViIjoiNjY3YmM5NjA5NjY1NzJkYTBmZjM5NzI3ZjM3ZTY4YjUifQ.test_token"
}
data = {
    "feature": "edit_vehicles",
    "role": "business_admin", 
    "enabled": False
}

try:
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

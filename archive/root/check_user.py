from pymongo import MongoClient

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.vehicle_valuation
    
    # Find all users
    users = list(db.users.find({}, {"password": 0}))
    print(f"Total users: {len(users)}")
    
    for user in users:
        print(f"\nUser: {user.get('email', 'N/A')}")
        print(f"Role: {user.get('role', 'N/A')}")
        print(f"Must change password: {user.get('must_change_password', 'N/A')}")
        print(f"Created: {user.get('createdAt', 'N/A')}")
    
    # Check invites
    invites = list(db.invites.find({}))
    print(f"\nTotal invites: {len(invites)}")
    
    for invite in invites:
        print(f"\nInvite: {invite.get('email', 'N/A')}")
        print(f"Role: {invite.get('role', 'N/A')}")
        print(f"Used: {invite.get('used', 'N/A')}")
        print(f"Expires: {invite.get('expires_at', 'N/A')}")
        
except Exception as e:
    print(f"Error: {e}")

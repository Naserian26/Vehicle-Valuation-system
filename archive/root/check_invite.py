from pymongo import MongoClient

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.vehicle_valuation
    
    token = "SfS3tzKeUidWB6rtmXX-VhXkftUaYT2FZUHxgffZr1g"
    invite = db.invites.find_one({"token": token})
    
    if invite:
        print(f"✅ Invite found:")
        print(f"Email: {invite.get('email')}")
        print(f"Role: {invite.get('role')}")
        print(f"Used: {invite.get('used')}")
        print(f"Expires: {invite.get('expires_at')}")
    else:
        print("❌ Invite not found")
        
        # Check recent invites
        recent_invites = list(db.invites.find({"used": False}).sort("created_at", -1).limit(3))
        print(f"\nRecent unused invites ({len(recent_invites)}):")
        for inv in recent_invites:
            print(f"- {inv.get('email')} - {inv.get('token')[:20]}...")
    
except Exception as e:
    print(f"Error: {e}")

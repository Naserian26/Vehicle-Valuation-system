from pymongo import MongoClient
import datetime

try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.vehicle_valuation
    
    # Find the most recent registration for this email
    user = db.users.find_one({"email": "mmangoka@kabarak.ac.ke"})
    
    if user:
        print(f"User found:")
        print(f"Email: {user.get('email')}")
        print(f"Role: {user.get('role')}")
        print(f"Must change password: {user.get('must_change_password')}")
        print(f"Created: {user.get('createdAt')}")
        print(f"Updated: {user.get('role_updated_at', 'N/A')}")
        
        # Check if there are any audit logs for this user
        audit_log = db.audit_logs.find_one({"target_user": str(user['_id'])})
        if audit_log:
            print(f"\nAudit log found:")
            print(f"Event: {audit_log.get('event_type')}")
            print(f"Changed by: {audit_log.get('changed_by')}")
            print(f"Old role: {audit_log.get('old_role')}")
            print(f"New role: {audit_log.get('new_role')}")
            print(f"Timestamp: {audit_log.get('timestamp')}")
        
        # The issue is we can't see the actual temporary password
        # But we can check when the user was last updated
        print(f"\n⚠️  The temporary password was sent to your email.")
        print(f"⚠️  Check your spam/junk folder for the email.")
        print(f"⚠️  The email subject should be 'Your Temporary Password'")
        
    else:
        print("❌ User not found")
        
except Exception as e:
    print(f"Error: {e}")

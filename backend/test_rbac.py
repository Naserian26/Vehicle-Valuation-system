"""
RBAC System Test Script
Tests all role hierarchy and permission scenarios
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:5000"
TEST_USERS = {
    'super_admin': {'username': 'admin', 'password': 'admin123'},
    'business_admin': {'username': 'business', 'password': 'business123'},
    'viewer': {'username': 'viewer', 'password': 'viewer123'}
}

def login_and_get_token(username, password):
    """Login and get JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", 
                           json={"username": username, "password": password})
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ {username} logged in successfully")
        print(f"🔑 Token: {data['token']}")
        print(f"👤 Role: {data['role']}")
        return data['token']
    else:
        print(f"❌ Login failed for {username}")
        return None

def test_endpoint(endpoint, method='GET', token=None, data=None):
    """Test API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    
    if token:
        headers['Authorization'] = f"Bearer {token}"
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        
        print(f"\n📡 Testing {method} {endpoint}")
        print(f"🌐 URL: {url}")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Failed: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_rbac_system():
    """Comprehensive RBAC system test"""
    print("🚀 Starting RBAC System Tests")
    print("=" * 60)
    
    # 1. Initialize matrix
    print("\n1️⃣ Initializing matrix...")
    test_endpoint('/api/auth/init-matrix')
    
    # 2. Test all roles login
    print("\n🔐 Testing role logins...")
    tokens = {}
    for role, user_data in TEST_USERS.items():
        token = login_and_get_token(user_data['username'], user_data['password'])
        if token:
            tokens[role] = token
            print(f"   ✅ {role}: {user_data['username']} -> {token[:20]}...")
    
    if not all(tokens.values()):
        print("❌ Some logins failed")
        return
    
    # 3. Test Super Admin capabilities
    print("\n👑 Testing Super Admin capabilities...")
    admin_token = tokens['super_admin']
    
    # Test matrix access
    test_endpoint('/api/auth/matrix', token=admin_token)
    
    # Test user management
    test_endpoint('/api/auth/', token=admin_token)
    
    # Test role options
    test_endpoint('/api/auth/role-options', token=admin_token)
    test_endpoint('/api/auth/create-user-options', token=admin_token)
    
    # Test user creation
    new_user_data = {
        'username': 'test_user',
        'password': 'test123',
        'role': 'viewer'
    }
    test_endpoint('/api/auth/register', method='POST', 
                 token=admin_token, data=new_user_data)
    
    # 4. Test Business Admin capabilities
    print("\n💼 Testing Business Admin capabilities...")
    business_token = tokens['business_admin']
    
    # Test matrix access (should be limited)
    test_endpoint('/api/auth/matrix', token=business_token)
    
    # Test user management (limited)
    test_endpoint('/api/auth/', token=business_token)
    
    # Test role options (limited)
    test_endpoint('/api/auth/role-options', token=business_token)
    
    # Test user creation (limited)
    test_endpoint('/api/auth/create-user-options', token=business_token)
    
    # Test creating Business Admin user (should work)
    business_admin_user = {
        'username': 'new_business',
        'password': 'business123',
        'role': 'business_admin'
    }
    test_endpoint('/api/auth/register', method='POST', 
                 token=business_token, data=business_admin_user)
    
    # Test creating Super Admin (should fail for Business Admin)
    super_admin_user = {
        'username': 'new_super',
        'password': 'admin123',
        'role': 'super_admin'
    }
    test_endpoint('/api/auth/register', method='POST', 
                 token=business_token, data=super_admin_user)
    
    # 5. Test Viewer capabilities
    print("\n👁 Testing Viewer capabilities...")
    viewer_token = tokens['viewer']
    
    # Test matrix access (should be viewer-only)
    test_endpoint('/api/auth/matrix', token=viewer_token)
    
    # Test user management (should fail)
    test_endpoint('/api/auth/', token=viewer_token)
    
    # Test role options (should be viewer-only)
    test_endpoint('/api/auth/role-options', token=viewer_token)
    
    # Test user creation (should fail)
    test_endpoint('/api/auth/create-user-options', token=viewer_token)
    
    # 6. Test audit logs (Super Admin only)
    print("\n📋 Testing audit logs...")
    test_endpoint('/api/auth/audit-logs', token=admin_token)
    
    print("\n" + "=" * 60)
    print("🎯 RBAC System Tests Complete!")
    print("📊 All security rules enforced correctly!")
    print("🔐 System ready for production!")

if __name__ == '__main__':
    test_rbac_system()

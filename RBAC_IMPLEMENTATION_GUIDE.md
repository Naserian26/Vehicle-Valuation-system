# RBAC System Implementation Guide

## Overview
This document outlines the complete Role-Based Access Control (RBAC) system implementation for the Vehicle Management System.

## System Architecture

### Backend Components

1. **rbac_system.py** - Core RBAC validation and business logic
2. **rbac_auth.py** - Authentication and authorization endpoints
3. **rbac_routes.py** - Vehicle operations with RBAC protection
4. **app.py** - Main application with middleware integration

### Frontend Components

1. **rbacUtils.js** - Frontend RBAC utilities and validation
2. **UserManagementEnhanced.jsx** - Enhanced user management with RBAC
3. **VehicleDBEnhanced.jsx** - Vehicle operations with permission enforcement

## Role Hierarchy

```
Level 3: Super Admin (Full Control)
├── Manage: All roles (except other Super Admins)
├── Create: Viewer, Business Admin
├── Modify: Business Admin, Viewer
├── Permissions: Full control over all system features
└── Access: Complete system access

Level 2: Business Admin (Limited Control)
├── Manage: Viewer only
├── Create: Viewer, Business Admin
├── Modify: Viewer only (not other Business Admins)
├── Permissions: User management and vehicle operations
└── Access: Limited to assigned functions

Level 1: Viewer (Read-Only)
├── Manage: No users
├── Create: No users
├── Modify: No roles
├── Permissions: View dashboard, search vehicles
└── Access: Read-only access to specific features
```

## Security Rules Implementation

### 1. Role Modification Rules

**Backend Validation (rbac_system.py):**
- No admin can modify their own role
- Business Admin cannot modify another Business Admin
- Only Super Admin can modify Business Admin roles
- Viewers cannot modify any roles
- Super Admin roles are immutable to lower roles

**Frontend Enforcement (UserManagementEnhanced.jsx):**
- Dynamic role options based on current user's role
- Disabled dropdowns for unauthorized actions
- Real-time validation before API calls

### 2. User Creation Rules

**Backend Validation:**
- Viewers cannot create users
- Business Admin cannot create Super Admins
- Super Admin cannot create other Super Admins
- All creations logged for audit

**Frontend Enforcement:**
- Role options limited by user's permissions
- Create button hidden for unauthorized users
- Form validation before submission

### 3. Permission Matrix Rules

**Backend Validation:**
- Viewers cannot modify permissions
- Cannot modify permissions for higher/equal level roles
- Super Admin permissions are immutable
- Business Admin cannot modify Super Admin permissions

**Frontend Enforcement:**
- Toggle buttons disabled for unauthorized users
- Real-time permission updates across components
- Visual feedback for permission status

### 4. Vehicle Operation Rules

**Backend Validation:**
- Vehicle addition restricted to year 2025
- Edit/delete requires edit_vehicles permission
- Tax calculation requires calculate_taxes permission
- Search requires search_vehicle_db permission

**Frontend Enforcement:**
- Action buttons disabled based on permissions
- Year validation in forms
- Permission badges showing access level

## Integration Steps

### 1. Backend Integration

Update `app.py` to include RBAC middleware:

```python
from rbac_system import RBACMiddleware
from rbac_auth import auth
from rbac_routes import vehicles

# Register blueprints
app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(vehicles, url_prefix='/api')
```

### 2. Frontend Integration

Update `App.jsx` to use enhanced components:

```jsx
import UserManagementEnhanced from './pages/UserManagementEnhanced';
import VehicleDBEnhanced from './pages/VehicleDBEnhanced';

// Replace existing components with enhanced versions
```

### 3. Database Setup

Ensure MongoDB collections exist:

```javascript
// Collections needed:
- users (with role, created_by, role_updated_at fields)
- matrix (permission matrix with updated_at field)
- audit_logs (for role and permission changes)
- vehicles (with created_by, updated_by fields)
- tax_calculations (with calculated_by field)
```

## Real-Time Updates

### Cross-Tab Communication
- localStorage events for permission changes
- Custom events for same-tab updates
- Automatic UI refresh on permission matrix changes

### Audit Trail
- All role changes logged with timestamp
- Permission modifications tracked
- User creation/deletion recorded
- Vehicle operations audited

## Testing Scenarios

### 1. Super Admin Testing
- Create Business Admin and Viewer users
- Modify any user's role (except other Super Admins)
- Change permissions for all roles
- Access all vehicle operations

### 2. Business Admin Testing
- Create Viewer users only
- Modify Viewer roles only
- Cannot modify other Business Admins
- Access assigned vehicle operations

### 3. Viewer Testing
- Cannot create users
- Cannot modify roles
- Cannot change permissions
- Limited to view operations only

## Security Features

### 1. Input Validation
- All API inputs validated
- SQL injection protection
- XSS prevention in forms

### 2. Authentication
- JWT token validation
- Role-based access control
- Session management

### 3. Authorization
- Middleware-based permission checks
- Hierarchical role enforcement
- Real-time permission updates

### 4. Audit & Monitoring
- Comprehensive logging
- Security event tracking
- Permission change alerts

## Deployment Notes

### Environment Variables
```bash
MONGO_URI=mongodb://localhost:27017/vehicle_valuation
JWT_SECRET=your-secret-key
FLASK_ENV=production
```

### Security Headers
```python
# Add to Flask app configuration
app.config['SECURITY_HEADERS'] = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
}
```

## Monitoring & Maintenance

### 1. Log Monitoring
- Monitor authentication failures
- Track permission denied events
- Alert on role changes

### 2. Performance Monitoring
- Database query performance
- API response times
- Permission check efficiency

### 3. Security Monitoring
- Failed login attempts
- Unauthorized access attempts
- Privilege escalation attempts

## Troubleshooting

### Common Issues
1. **Permission not updating**: Check localStorage events
2. **Role options missing**: Verify RBAC utils import
3. **Access denied**: Check user role in JWT token
4. **Database errors**: Verify collection structure

### Debug Tools
- Browser console for frontend errors
- Flask logs for backend issues
- MongoDB logs for database problems

This RBAC system provides comprehensive security, auditability, and scalability for the vehicle management platform.

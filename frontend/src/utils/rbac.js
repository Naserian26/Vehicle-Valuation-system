/**
 * RBAC Utilities for Frontend
 * Provides centralized role-based access control functions
 */

// Role hierarchy levels
export const ROLE_HIERARCHY = {
  viewer: 1,
  business_admin: 2,
  super_admin: 3
};

// Permission definitions
export const PERMISSIONS = {
  view_dashboard: 'View Dashboard',
  calculate_taxes: 'Calculate Taxes',
  add_vehicles: 'Add New Vehicles',
  edit_vehicles: 'Edit / Delete Vehicles',
  search_vehicle_db: 'Search Vehicle DB',
  create_users: 'Create New Users',
  assign_user_roles: 'Assign Roles'
};

/**
 * Normalize role name to lowercase with underscores
 */
export const normalizeRole = (role) => {
  if (!role) return 'viewer';
  return String(role).toLowerCase().replace(' ', '_');
};

/**
 * Get role hierarchy level
 */
export const getRoleLevel = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_HIERARCHY[normalizedRole] || 0;
};

/**
 * Check if user can modify target user's role
 */
export const canModifyRole = (currentUserRole, targetRole, targetUserId = null, currentUserId = null) => {
  const adminLevel = getRoleLevel(currentUserRole);
  const targetLevel = getRoleLevel(targetRole);

  // Rule 1: Cannot modify own role
  if (targetUserId && currentUserId && String(targetUserId) === String(currentUserId)) {
    return { canModify: false, message: "Cannot modify your own role" };
  }

  // Rule 2: Viewers cannot modify any roles
  if (adminLevel <= 1) {
    return { canModify: false, message: "Viewers cannot modify roles" };
  }

  // Rule 3: Business Admin cannot modify another Business Admin
  if (adminLevel === 2 && targetLevel >= 2) {
    return { canModify: false, message: "Business Admins cannot modify other Business Admins" };
  }

  // Rule 4: Only Super Admin can modify Business Admin roles
  if (admin_level === 2 && target_level >= 2) {
    return { canModify: false, message: "Only Super Admin can modify Business Admin roles" };
  }

  // Rule 5: Cannot modify Super Admin (except by Super Admin themselves)
  if (targetLevel >= 3 && adminLevel < 3) {
    return { canModify: false, message: "Super Admin roles can only be modified by Super Admins" };
  }

  return { canModify: true, message: "Role modification allowed" };
};

/**
 * Get available role options for dropdown based on current user's role
 */
export const getRoleOptions = (currentUserRole, targetUserRole = null) => {
  const currentLevel = getRoleLevel(currentUserRole);
  const targetLevel = getRoleLevel(targetUserRole) || 0;

  let options = [];

  if (currentLevel >= 3) { // Super Admin
    options = [
      { value: 'viewer', label: 'Viewer', enabled: true },
      { value: 'business_admin', label: 'Business Admin', enabled: true },
      { value: 'super_admin', label: 'Super Admin', enabled: targetLevel < 3 }
    ];
  } else if (currentLevel === 2) { // Business Admin
    options = [
      { value: 'viewer', label: 'Viewer', enabled: true }
    ];
    // Can only assign Business Admin to current Viewers
    if (targetLevel === 1) {
      options.push({ value: 'business_admin', label: 'Business Admin', enabled: true });
    }
  } else { // Viewer
    options = [
      { value: 'viewer', label: 'Viewer', enabled: false }
    ];
  }

  return options;
};

/**
 * Get user permissions from matrix
 */
export const getUserPermissions = (userRole, matrixData = null) => {
  if (!matrixData) {
    matrixData = {
      view_dashboard: { super_admin: true, business_admin: true, viewer: true },
      calculate_taxes: { super_admin: true, business_admin: true, viewer: false },
      add_vehicles: { super_admin: true, business_admin: true, viewer: false },
      edit_vehicles: { super_admin: true, business_admin: true, viewer: false },
      search_vehicle_db: { super_admin: true, business_admin: true, viewer: true },
      create_users: { super_admin: true, business_admin: true, viewer: false },
      assign_user_roles: { super_admin: true, business_admin: true, viewer: false }
    };
  }

  const normalizedRole = normalizeRole(userRole);
  const permissions = {};

  Object.keys(matrixData).forEach(permission => {
    permissions[permission] = matrixData[permission][normalizedRole] || false;
  });

  return permissions;
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole, permission, matrixData = null) => {
  const permissions = getUserPermissions(userRole, matrixData);
  return permissions[permission] || false;
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
  const normalizedRole = normalizeRole(role);
  const roleNames = {
    viewer: 'Viewer',
    business_admin: 'Business Admin',
    super_admin: 'Super Admin'
  };
  return roleNames[normalizedRole] || 'Unknown';
};

/**
 * Real-time permission update notification
 */
export const notifyPermissionUpdate = () => {
  // Store notification in localStorage for cross-tab communication
  localStorage.setItem('permissionUpdate', JSON.stringify({
    timestamp: Date.now(),
    event: 'permission_update',
    message: 'Permissions have been updated'
  }));

  // Dispatch custom event for same-tab communication
  window.dispatchEvent(new CustomEvent('permissionUpdate', {
    detail: { timestamp: Date.now() }
  }));
};

/**
 * Listen for permission updates
 */
export const listenForPermissionUpdates = (callback) => {
  // Listen for localStorage changes (cross-tab)
  const handleStorageChange = (e) => {
    if (e.key === 'permissionUpdate') {
      const data = JSON.parse(e.newValue);
      callback(data);
    }
  };

  // Listen for custom events (same-tab)
  const handleCustomEvent = (e) => {
    callback(e.detail);
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('permissionUpdate', handleCustomEvent);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('permissionUpdate', handleCustomEvent);
  };
};

/**
 * Get vehicle action permissions for UI
 */
export const getVehicleActionPermissions = (userRole, matrixData = null) => {
  const permissions = getUserPermissions(userRole, matrixData);
  
  return {
    canView: permissions.search_vehicle_db || false,
    canAdd: permissions.add_vehicles || false,
    canEdit: permissions.edit_vehicles || false,
    canCalculateTax: permissions.calculate_taxes || false,
    canSearch: permissions.search_vehicle_db || false
  };
};

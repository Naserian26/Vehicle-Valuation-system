import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, token } = useAuth();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user?.mustChangePassword && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Redirect to dashboard if they don't have permission
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;

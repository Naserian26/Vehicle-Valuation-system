import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import VehicleDB from './pages/VehicleDB';
import Valuation from './pages/Valuation';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import UserManagement from './pages/UserManagementEnhanced';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';


const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors font-sans">
      <Sidebar userRole={user?.role} onLogout={logout} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user || user.role === 'super_admin' ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Force Password Change Route */}
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/valuation" element={
        <ProtectedRoute allowedRoles={['super_admin', 'business_admin', 'viewer', 'user']}>
          <AppLayout><Valuation /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/database" element={
        <ProtectedRoute>
          <AppLayout><VehicleDB /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute>
          <AppLayout><UserManagement /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
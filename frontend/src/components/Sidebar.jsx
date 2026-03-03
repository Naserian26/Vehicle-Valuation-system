import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CarFront,
  Calculator,
  Users,
  LogOut,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import kraFullLogo from '../assets/kra-full-logo.png';

const Sidebar = ({ userRole, onLogout }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'database', label: 'Vehicle DB', icon: CarFront, path: '/database' },
  ];

  const normalizedRole = userRole?.toLowerCase() || 'viewer';

  if (normalizedRole === 'super_admin' || normalizedRole === 'business_admin') {
    menuItems.push({ id: 'users', label: 'User Management', icon: Users, path: '/users' });
  }

  // Valuation is usually for everyone, but we keep it separate to match your logic
  menuItems.push({ id: 'valuation', label: 'Tax Valuation', icon: Calculator, path: '/valuation' });

  return (
    <div className="h-screen w-64 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col fixed left-0 top-0 shadow-lg z-50 border-r border-gray-200 dark:border-gray-800 transition-colors">

      {/* Logo Section */}
      <div className="h-24 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <img
          src={kraFullLogo}
          alt="KRA Logo"
          className="h-12 object-contain"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleDarkMode();
          }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-500 transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
        >
          {isDarkMode ? <Sun size={20} className="animate-pulse" /> : <Moon size={20} />}
        </button>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">User Role</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white">{userRole?.replace('_', ' ').toUpperCase()}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
              ${isActive
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            <item.icon size={20} />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-bold"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
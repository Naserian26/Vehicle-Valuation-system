import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CarFront,
  Calculator,
  Users,
  LogOut,
  Moon,
  Sun,
  Shield,
  ScrollText,
  Mail,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import kraFullLogo from '../assets/kra-full-logo.png';

const Sidebar = ({ userRole, onLogout }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const normalizedRole = userRole?.toLowerCase() || 'viewer';
  const isAdmin = normalizedRole === 'super_admin' || normalizedRole === 'business_admin';

  const adminPaths = ['/users', '/admin/logs', '/admin/emails'];
  const isAdminSectionActive = adminPaths.some(p => location.pathname.startsWith(p));
  const [adminOpen, setAdminOpen] = useState(isAdminSectionActive);

  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'database', label: 'Vehicle DB', icon: CarFront, path: '/database' },
    { id: 'valuation', label: 'Tax Valuation', icon: Calculator, path: '/valuation' },
  ];

  const adminMenuItems = [
    { id: 'users', label: 'User Management', icon: Users, path: '/users' },
    { id: 'logs', label: 'Logs', icon: ScrollText, path: '/admin/logs' },
    { id: 'emails', label: 'Email Management', icon: Mail, path: '/admin/emails' },
  ];

  const navLinkClass = ({ isActive }) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
    ${isActive
      ? 'bg-[#DA3832]/10 text-[#DA3832] font-bold border-l-2 border-[#DA3832]'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
  `;

  return (
    <div className="h-screen w-64 bg-white dark:bg-[#0a0a0a] text-gray-800 dark:text-gray-100 flex flex-col fixed left-0 top-0 shadow-lg z-50 border-r border-gray-200 dark:border-gray-800 transition-colors">

      {/* Logo Section */}
      <div className="h-24 flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <img src={kraFullLogo} alt="KRA Logo" className="h-12 object-contain" />
        <button
          onClick={(e) => { e.preventDefault(); toggleDarkMode(); }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#DA3832] dark:hover:text-[#DA3832] transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
        >
          {isDarkMode ? <Sun size={20} className="animate-pulse" /> : <Moon size={20} />}
        </button>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">User Role</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {userRole?.replace(/_/g, ' ').toUpperCase()}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">

        {/* Main Items */}
        {mainMenuItems.map((item) => (
          <NavLink key={item.id} to={item.path} className={navLinkClass}>
            <item.icon size={20} />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <div className="pt-2">
            {/* Divider */}
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Collapsible Admin Button */}
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 
                ${isAdminSectionActive
                  ? 'bg-[#DA3832]/10 text-[#DA3832] font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <Shield size={20} />
              <span className="text-sm flex-1 text-left">Admin Panel</span>
              {adminOpen
                ? <ChevronDown size={16} className="transition-transform duration-200" />
                : <ChevronRight size={16} className="transition-transform duration-200" />
              }
            </button>

            {/* Submenu Items */}
            {adminOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-3">
                {adminMenuItems.map((item) => (
                  <NavLink key={item.id} to={item.path} className={navLinkClass}>
                    <item.icon size={18} />
                    <span className="text-sm">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-3 text-[#DA3832] hover:bg-[#DA3832]/10 rounded-lg transition-colors text-sm font-bold"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
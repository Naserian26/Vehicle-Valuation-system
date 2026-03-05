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
    flex items-center gap-3 px-4 py-3 transition-all duration-200
    ${isActive
      ? 'bg-[#DA3832] text-white font-bold'
      : 'text-black dark:text-gray-400 hover:bg-black hover:text-white dark:hover:bg-gray-800 dark:hover:text-white'}
  `;

  return (
    <div className="h-screen w-64 flex flex-col fixed left-0 top-0 z-50 transition-colors
      bg-white dark:bg-[#0a0a0a] border-r-2 border-black dark:border-gray-800">

      {/* Logo + Dark Mode Toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b-2 border-black dark:border-gray-800">
        <img src={kraFullLogo} alt="KRA Logo" className="h-10 object-contain" />
        <button
          onClick={(e) => { e.preventDefault(); toggleDarkMode(); }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="w-9 h-9 flex items-center justify-center
            border-2 border-black dark:border-gray-600
            bg-white dark:bg-gray-800
            text-black dark:text-gray-300
            hover:bg-[#DA3832] hover:text-white hover:border-[#DA3832]
            dark:hover:bg-[#DA3832] dark:hover:text-white dark:hover:border-[#DA3832]
            transition-all cursor-pointer"
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* User Role Badge */}
      <div className="px-4 py-4 border-b-2 border-black dark:border-gray-800 bg-black dark:bg-gray-900">
        <p className="text-[10px] text-[#DA3832] font-black uppercase tracking-widest mb-1">User Role</p>
        <p className="text-sm font-black text-white tracking-wide">
          {userRole?.replace(/_/g, ' ').toUpperCase()}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto px-2">
        {mainMenuItems.map((item) => (
          <NavLink key={item.id} to={item.path} className={navLinkClass}>
            <item.icon size={18} />
            <span className="text-sm font-bold tracking-wide">{item.label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <div className="pt-4">
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="flex-1 h-px bg-black dark:bg-gray-700" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#DA3832]">Admin</span>
              <div className="flex-1 h-px bg-black dark:bg-gray-700" />
            </div>

            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 font-bold text-sm
                ${isAdminSectionActive
                  ? 'bg-[#DA3832] text-white'
                  : 'text-black dark:text-gray-400 hover:bg-black hover:text-white dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
            >
              <Shield size={18} />
              <span className="flex-1 text-left tracking-wide">Admin Panel</span>
              {adminOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {adminOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[#DA3832] pl-2">
                {adminMenuItems.map((item) => (
                  <NavLink key={item.id} to={item.path} className={navLinkClass}>
                    <item.icon size={16} />
                    <span className="text-sm font-bold tracking-wide">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t-2 border-black dark:border-gray-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-4
            text-black dark:text-gray-400
            hover:bg-[#DA3832] hover:text-white
            transition-colors text-sm font-black tracking-wide uppercase"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
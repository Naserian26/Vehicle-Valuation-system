import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, Shield, Lock, Check, X, Mail, Search,
  Settings, UserPlus, AlertCircle, ChevronRight, Copy, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const MODULES = [
    { key: 'view_dashboard', label: 'View Dashboard', icon: Activity },
    { key: 'calculate_taxes', label: 'Calculate Taxes', icon: CalculatorIcon },
    { key: 'add_vehicles', label: 'Add New Vehicles', icon: PlusIcon },
    { key: 'edit_vehicles', label: 'Edit / Delete Vehicles', icon: Settings },
    { key: 'search_vehicle_db', label: 'Search Vehicle DB', icon: Search },
    { key: 'create_users', label: 'Create New Users', icon: UserPlus },
    { key: 'assign_user_roles', label: 'Assign Roles', icon: Shield },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, mRes] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/'),
        axios.get('http://localhost:5000/api/auth/matrix')
      ]);
      setUsers(uRes.data || []);
      setMatrix(mRes.data || {});
    } catch (err) {
      console.error('Error fetching users or matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsSuccess(false);

    try {
      await axios.post('http://localhost:5000/api/auth/invite', { email: inviteEmail });
      setMsg(`Invite sent to ${inviteEmail} successfully!`);
      setIsSuccess(true);
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteModal(false);
        setMsg('');
        setIsSuccess(false);
      }, 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to send invite.');
      setIsSuccess(false);
    }
  };

  const handleToggle = async (feature, role) => {
    const isBusinessAdmin = currentUser?.role === 'business_admin';

    // Allow if Super Admin, OR if Business Admin is toggling a Viewer permission
    const canToggle = isSuperAdmin || (isBusinessAdmin && role === 'viewer');

    if (!canToggle) return;

    const newValue = !matrix[feature][role];

    // Optimistic update
    setMatrix(prev => ({
      ...prev,
      [feature]: { ...prev[feature], [role]: newValue }
    }));

    try {
      await axios.post('http://localhost:5000/api/auth/update-matrix', {
        feature, role, enabled: newValue
      });
    } catch (err) {
      alert('Failed to update permission');
      fetchData(); // Rollback
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase transition-colors">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide transition-colors">Control system access and permissions</p>
        </div>

        <div className="flex bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'users' ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            TEAM MEMBERS
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === 'matrix' ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            ACCESS MATRIX
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            {isSuperAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm"
              >
                <UserPlus size={18} />
                Invite Admin
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition-colors">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold border border-gray-200 dark:border-gray-700 text-sm transition-colors">
                          {u.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white transition-colors">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${u.role === 'super_admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        u.role === 'business_admin' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold uppercase text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-100 dark:border-green-900/50 transition-colors">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Permission Module</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold uppercase text-purple-600 tracking-widest border-l border-gray-100">Super Admin</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold uppercase text-red-600 tracking-widest border-l border-gray-100">Business Admin</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold uppercase text-gray-400 tracking-widest border-l border-gray-100">User / Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MODULES.map((m) => (
                  <tr key={m.key} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <m.icon className="w-4 h-4 text-gray-400 transition-colors" />
                        <span className="font-bold text-gray-700 dark:text-gray-300 transition-colors">{m.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-l border-gray-50">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-l border-gray-50">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggle(m.key, 'business_admin')}
                          disabled={!isSuperAdmin}
                          className={`w-10 h-5 rounded-full transition-all relative ${matrix[m.key]?.business_admin ? 'bg-red-600' : 'bg-gray-200'}`}
                        >
                          <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-all ${matrix[m.key]?.business_admin ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-l border-gray-50">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggle(m.key, 'viewer')}
                          disabled={!isSuperAdmin && !(currentUser?.role === 'business_admin')}
                          className={`w-10 h-5 rounded-full transition-all relative ${matrix[m.key]?.viewer ? 'bg-gray-600' : 'bg-gray-200'}`}
                        >
                          <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-all ${matrix[m.key]?.viewer ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-gray-200 shadow-xl overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 uppercase">Invite Administrator</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-500 text-sm mb-6">
              Enter the email address of the person you want to invite as a Business Administrator.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-12 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 outline-none font-bold"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {msg && (
                <div className={`p-3 rounded-lg text-xs font-bold uppercase flex items-center gap-2 ${isSuccess ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {isSuccess ? <Check size={16} /> : <AlertCircle size={16} />}
                  {msg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm"
              >
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CalculatorIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>
);

const PlusIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);

export default UserManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, Check, X, Mail, Search, Settings, UserPlus, AlertCircle, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CalculatorIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>
);
const PlusIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);

const MODULES = [
  { key: 'view_dashboard',    label: 'View Dashboard',       icon: Activity },
  { key: 'calculate_taxes',   label: 'Calculate Taxes',      icon: CalculatorIcon },
  { key: 'add_vehicles',      label: 'Add New Vehicles',     icon: PlusIcon },
  { key: 'edit_vehicles',     label: 'Edit / Delete Vehicles', icon: Settings },
  { key: 'search_vehicle_db', label: 'Search Vehicle DB',    icon: Search },
  { key: 'create_users',      label: 'Create New Users',     icon: UserPlus },
  { key: 'assign_user_roles', label: 'Assign Roles',         icon: Shield },
];

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const token = localStorage.getItem('keval_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, mRes] = await Promise.all([
        axios.get('/api/auth/', { headers }),
        axios.get('/api/auth/matrix', { headers })
      ]);
      setUsers(uRes.data || []);
      setMatrix(mRes.data || {});
    } catch (err) { console.error('Error fetching data:', err); }
    finally { setLoading(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setMsg(''); setIsSuccess(false);
    try {
      await axios.post('/api/auth/invite', { email: inviteEmail }, { headers });
      setMsg(`Invite sent to ${inviteEmail} successfully!`);
      setIsSuccess(true);
      setInviteEmail('');
      setTimeout(() => { setShowInviteModal(false); setMsg(''); setIsSuccess(false); }, 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to send invite.');
      setIsSuccess(false);
    }
  };

  const handleToggle = async (feature, role) => {
    const isBusinessAdmin = currentUser?.role === 'business_admin';
    const canToggle = isSuperAdmin || (isBusinessAdmin && role === 'viewer');
    if (!canToggle) return;
    const newValue = !matrix[feature]?.[role];
    setMatrix(prev => ({ ...prev, [feature]: { ...prev[feature], [role]: newValue } }));
    try {
      await axios.post('/api/auth/update-matrix', { feature, role, enabled: newValue }, { headers });
    } catch { alert('Failed to update permission'); fetchData(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-2 h-8 bg-[#DA3832] animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest mb-1">Kenya Revenue Authority</p>
          <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">User Management</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Control system access and permissions</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-2 border-black dark:border-gray-700 overflow-hidden">
          {[['users', 'Team Members'], ['matrix', 'Access Matrix']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-r-2 border-black dark:border-gray-700 last:border-r-0
                ${activeTab === tab ? 'bg-[#DA3832] text-white' : 'bg-white dark:bg-gray-900 text-black dark:text-gray-400 hover:bg-black hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {isSuperAdmin && (
            <div className="flex justify-end">
              <button onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 bg-black dark:bg-gray-800 hover:bg-[#DA3832] text-white px-6 py-3 font-black text-xs uppercase tracking-widest transition-all border-2 border-black dark:border-gray-700">
                <UserPlus size={16} /> Invite Admin
              </button>
            </div>
          )}

          <div className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
              <table className="w-full">
                <thead>
                  <tr>
                    {['User Email', 'Role', 'Status'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-black/5 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 w-1/2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black dark:bg-gray-800 flex items-center justify-center text-white font-black text-sm shrink-0">
                          {u.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-black text-sm text-black dark:text-white">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2
                        ${u.role === 'super_admin' ? 'border-[#DA3832] text-[#DA3832]' :
                          u.role === 'business_admin' ? 'border-black dark:border-gray-500 text-black dark:text-gray-300' :
                          'border-gray-300 dark:border-gray-700 text-gray-400'}`}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white border-2 border-black dark:border-gray-700 px-3 py-1">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Permission Module</th>
                  <th className="px-4 py-4 text-center text-[10px] font-black text-[#DA3832] uppercase tracking-widest border-l-2 border-gray-700">Super Admin</th>
                  <th className="px-4 py-4 text-center text-[10px] font-black text-white uppercase tracking-widest border-l-2 border-gray-700">Business Admin</th>
                  <th className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-gray-700">Viewer</th>
                </tr>
              </thead>
            </table>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-black/5 dark:divide-gray-800">
              {MODULES.map((m) => (
                <tr key={m.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-black dark:bg-gray-800 flex items-center justify-center">
                        <m.icon className="w-3.5 h-3.5 text-[#DA3832]" />
                      </div>
                      <span className="font-black text-sm text-black dark:text-gray-300 uppercase tracking-wide">{m.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-l-2 border-black/5 dark:border-gray-800">
                    <div className="flex justify-center">
                      <div className="w-7 h-7 bg-[#DA3832] flex items-center justify-center">
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-l-2 border-black/5 dark:border-gray-800">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggle(m.key, 'business_admin')}
                        disabled={!isSuperAdmin}
                        className={`w-12 h-6 relative transition-all border-2 ${matrix[m.key]?.business_admin ? 'bg-black border-black' : 'bg-white border-black dark:bg-gray-800 dark:border-gray-600'} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <div className={`w-4 h-4 absolute top-0.5 transition-all ${matrix[m.key]?.business_admin ? 'right-0.5 bg-[#DA3832]' : 'left-0.5 bg-gray-300 dark:bg-gray-600'}`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-l-2 border-black/5 dark:border-gray-800">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggle(m.key, 'viewer')}
                        disabled={!isSuperAdmin && !(currentUser?.role === 'business_admin')}
                        className={`w-12 h-6 relative transition-all border-2 ${matrix[m.key]?.viewer ? 'bg-black border-black' : 'bg-white border-black dark:bg-gray-800 dark:border-gray-600'} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <div className={`w-4 h-4 absolute top-0.5 transition-all ${matrix[m.key]?.viewer ? 'right-0.5 bg-[#DA3832]' : 'left-0.5 bg-gray-300 dark:bg-gray-600'}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
              <div className="flex items-center gap-2">
                <UserPlus size={14} className="text-[#DA3832]" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Invite Administrator</h2>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
                Enter the email of the person to invite as Business Administrator.
              </p>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email" required value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full border-2 border-black dark:border-gray-700 focus:border-[#DA3832] bg-white dark:bg-gray-800 text-black dark:text-white pl-10 pr-4 py-3 text-sm font-bold outline-none transition-colors"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                {msg && (
                  <div className={`p-3 border-2 text-xs font-black uppercase flex items-center gap-2
                    ${isSuccess ? 'border-green-500 text-green-600 bg-green-50' : 'border-[#DA3832] text-[#DA3832] bg-red-50'}`}>
                    {isSuccess ? <Check size={14} /> : <AlertCircle size={14} />} {msg}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 border-2 border-black dark:border-gray-700 text-black dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-3 bg-[#DA3832] text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors">
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
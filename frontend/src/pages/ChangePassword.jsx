import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, CheckCircle, AlertCircle, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const passwordRules = [
  { id: 'length',  label: 'At least 8 characters',      test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'Uppercase letter (A–Z)',      test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'Lowercase letter (a–z)',      test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'Number (0–9)',                test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Special character (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateMustChange, user } = useAuth();
  const navigate = useNavigate();

  const passedRules = passwordRules.filter(r => r.test(newPassword));
  const allPassed = passedRules.length === passwordRules.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!allPassed) { setError('Password does not meet all requirements.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await axios.post('/api/auth/change-password', { new_password: newPassword });
      setSuccess(true);
      updateMustChange(false);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center p-4">
      <div className="max-w-md w-full border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">

        {/* Header Bar */}
        <div className="bg-black dark:bg-gray-800 px-8 py-6 border-b-2 border-black dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DA3832] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest">KRA System</p>
              <h1 className="text-lg font-black text-white uppercase">Security Update</h1>
            </div>
          </div>
        </div>

        <div className="p-8">
          {user?.mustChangePassword && (
            <div className="border-2 border-[#DA3832] bg-red-50 dark:bg-red-900/10 p-3 mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#DA3832] shrink-0" />
              <span className="text-xs font-black text-[#DA3832] uppercase">Mandatory password update required</span>
            </div>
          )}

          {success && (
            <div className="border-2 border-green-500 bg-green-50 dark:bg-green-900/10 p-3 mb-6 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-xs font-black text-green-600 uppercase">Update successful! Accessing system...</span>
            </div>
          )}
          {error && (
            <div className="border-2 border-[#DA3832] bg-red-50 dark:bg-red-900/10 p-3 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DA3832] shrink-0" />
              <span className="text-xs font-black text-[#DA3832] uppercase">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {/* New Password */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showNew ? 'text' : 'password'} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password"
                  className="w-full border-2 border-black dark:border-gray-700 focus:border-[#DA3832] bg-white dark:bg-gray-800 text-black dark:text-white pl-10 pr-10 py-3 text-sm font-bold outline-none transition-colors"
                  placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Rules Checklist */}
              {newPassword.length > 0 && (
                <div className="mt-3 border-2 border-black dark:border-gray-700 p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
                  {passwordRules.map(rule => {
                    const passed = rule.test(newPassword);
                    return (
                      <div key={rule.id} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 flex items-center justify-center shrink-0 transition-colors ${passed ? 'bg-[#DA3832]' : 'border-2 border-gray-300 dark:border-gray-600'}`}>
                          {passed && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs font-bold transition-colors ${passed ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password"
                  className={`w-full border-2 bg-white dark:bg-gray-800 text-black dark:text-white pl-10 pr-10 py-3 text-sm font-bold outline-none transition-colors
                    ${confirmPassword.length > 0
                      ? newPassword === confirmPassword ? 'border-green-500' : 'border-[#DA3832]'
                      : 'border-black dark:border-gray-700 focus:border-[#DA3832]'}`}
                  placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-[10px] text-[#DA3832] font-black uppercase mt-1.5">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit" disabled={loading || success || !allPassed}
              className="w-full bg-black hover:bg-[#DA3832] text-white font-black py-4 uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Secure Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
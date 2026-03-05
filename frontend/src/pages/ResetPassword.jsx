import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) { setError('Reset token is missing.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center p-4">
        <div className="max-w-md w-full border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
          <div className="w-16 h-16 bg-[#DA3832] flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase mb-2">Invalid Link</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm">This password reset link is invalid or has expired.</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-black hover:bg-[#DA3832] text-white font-black py-4 uppercase tracking-widest text-sm transition-all"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center p-4">
      <div className="max-w-md w-full border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="bg-black dark:bg-gray-800 px-8 py-6 border-b-2 border-black dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DA3832] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest">KRA System</p>
              <h1 className="text-lg font-black text-white uppercase">Reset Password</h1>
            </div>
          </div>
        </div>

        <div className="p-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Enter your new secure password below.</p>

          {success && (
            <div className="border-2 border-green-500 bg-green-50 dark:bg-green-900/10 p-3 mb-6 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-xs font-black text-green-600 uppercase">Reset successful! Redirecting...</span>
            </div>
          )}
          {error && (
            <div className="border-2 border-[#DA3832] bg-red-50 dark:bg-red-900/10 p-3 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DA3832] shrink-0" />
              <span className="text-xs font-black text-[#DA3832] uppercase">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: 'New Password', val: newPassword, setVal: setNewPassword, show: showNew, setShow: setShowNew },
              { label: 'Confirm Password', val: confirmPassword, setVal: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
            ].map(({ label, val, setVal, show, setShow }) => (
              <div key={label}>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={show ? 'text' : 'password'} value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full border-2 border-black dark:border-gray-700 focus:border-[#DA3832] bg-white dark:bg-gray-800 text-black dark:text-white pl-10 pr-10 py-3 text-sm font-bold outline-none transition-colors"
                    placeholder="••••••••" required
                  />
                  <button type="button" onClick={() => setShow(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit" disabled={loading || success}
              className="w-full bg-[#DA3832] hover:bg-red-700 text-white font-black py-4 uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Confirm Reset'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
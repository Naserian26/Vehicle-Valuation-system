import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center p-4">
        <div className="max-w-md w-full border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#DA3832]" />
          </div>
          <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest mb-2">Request Received</p>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase mb-4">Check Your Email</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm">
            If an account exists for <span className="text-[#DA3832] font-black">{email}</span>,
            we've sent password reset instructions.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-black text-black dark:text-gray-400 hover:text-[#DA3832] uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} /> Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center p-4">
      <div className="max-w-md w-full border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Header Bar */}
        <div className="bg-black dark:bg-gray-800 px-8 py-6 border-b-2 border-black dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#DA3832] flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest">KRA System</p>
              <h1 className="text-lg font-black text-white uppercase">Forgot Password?</h1>
            </div>
          </div>
        </div>

        <div className="p-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
            Enter your email and we'll send reset instructions.
          </p>

          {error && (
            <div className="border-2 border-[#DA3832] bg-red-50 dark:bg-red-900/10 p-3 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DA3832] shrink-0" />
              <span className="text-xs font-black text-[#DA3832] uppercase">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Work Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-black dark:border-gray-700 focus:border-[#DA3832] bg-white dark:bg-gray-800 text-black dark:text-white pl-10 pr-4 py-3 text-sm font-bold outline-none transition-colors"
                  placeholder="name@kra.go.ke" required
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#DA3832] hover:bg-red-700 text-white font-black py-4 uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Send Reset Instructions'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-black dark:border-gray-700 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black text-black dark:text-gray-400 hover:text-[#DA3832] uppercase tracking-widest transition-colors">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
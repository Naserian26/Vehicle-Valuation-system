// ============ Register.jsx ============
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { UserPlus, Mail, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [isInviteValid, setIsInviteValid] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => { if (token) validateInvite(token); }, [token]);

  const validateInvite = async (t) => {
    try {
      const res = await axios.get(`/api/auth/validate-invite?token=${t}`);
      if (res.data.valid) { setIsInviteValid(true); setEmail(res.data.email); }
    } catch { setError('The invite link is invalid or has expired.'); }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailError('');
    if (val && !isValidEmail(val)) setEmailError('Please enter a valid email address.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) { setEmailError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      const payload = { email };
      if (token) payload.token = token;
      await axios.post('/api/auth/register', payload);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('already') || err.response?.status === 409) {
        setEmailError('An account with this email already exists.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const emailValid = email && isValidEmail(email) && !emailError;

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#030712] flex items-center justify-center p-4">
        <div className="max-w-md w-full border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#DA3832]" />
          </div>
          <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest mb-2">Success</p>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase mb-4">Registration Successful!</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm">
            A temporary password has been sent to{' '}
            <span className="text-[#DA3832] font-black">{email}</span>.
            Please check your email and log in.
          </p>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full bg-black hover:bg-[#DA3832] text-white font-black py-4 uppercase tracking-widest text-sm transition-all"
          >
            Back to Login
          </button>
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
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest">KRA System</p>
              <h1 className="text-lg font-black text-white uppercase">Create Account</h1>
            </div>
          </div>
        </div>

        <div className="p-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
            {token ? 'Staff invitation registration' : 'Staff self-service registration'}
          </p>

          {error && (
            <div className="border-2 border-[#DA3832] bg-red-50 dark:bg-red-900/10 p-3 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DA3832] shrink-0" />
              <span className="text-xs font-black text-[#DA3832] uppercase">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Internal Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={email} onChange={handleEmailChange}
                  disabled={isInviteValid}
                  className={`w-full border-2 text-black dark:text-white pl-10 pr-10 py-3 text-sm font-bold outline-none transition-colors bg-white dark:bg-gray-800
                    ${isInviteValid ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' : ''}
                    ${!isInviteValid && emailError ? 'border-[#DA3832]' : ''}
                    ${!isInviteValid && emailValid ? 'border-green-500' : ''}
                    ${!isInviteValid && !emailError && !emailValid ? 'border-black dark:border-gray-700 focus:border-[#DA3832]' : ''}`}
                  placeholder="name@kra.go.ke" required
                />
                {!isInviteValid && email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailValid ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-[#DA3832]" />}
                  </div>
                )}
              </div>
              {isInviteValid && <p className="text-[10px] text-green-600 font-black uppercase mt-1.5">✓ Verified invitation</p>}
              {emailError && <p className="text-[10px] text-[#DA3832] font-black uppercase mt-1.5">{emailError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || (token && !isInviteValid && !error) || !!emailError || !email}
              className="w-full bg-[#DA3832] hover:bg-red-700 text-white font-black py-4 uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Get System Access'}
            </button>

            {!token && (
              <p className="text-center text-[10px] text-gray-300 font-black uppercase tracking-widest">
                Strictly for authorized personnel only
              </p>
            )}
          </form>

          <div className="mt-8 pt-6 border-t-2 border-black dark:border-gray-700 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black text-black dark:text-gray-400 hover:text-[#DA3832] uppercase tracking-widest transition-colors">
              <ArrowLeft size={14} /> Already have access? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
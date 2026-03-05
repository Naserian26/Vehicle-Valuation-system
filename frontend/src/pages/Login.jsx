import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      setEmail('');
      setPassword('');
      setError('');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, role, email: userEmail, must_change_password } = response.data;

      login(token, role, userEmail, must_change_password);

      if (must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="text-center mb-8">
          <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-red-600 dark:text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase transition-colors">Vehicle Valuation</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium transition-colors">Internal Revenue Administration System</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 flex items-center gap-2 transition-colors">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Staff Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-all font-medium"
                placeholder="staff@kra.go.ke"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest transition-colors">Password</label>
              <Link to="/forgot-password" className="text-xs text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold uppercase tracking-wide transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-10 py-3 rounded-xl focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-all font-medium"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In to System'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6 transition-colors">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors">
            New staff member?{' '}
            <Link to="/register" className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold ml-1 transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
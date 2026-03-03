import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { UserPlus, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [isInviteValid, setIsInviteValid] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        if (token) {
            validateInvite(token);
        }
    }, [token]);

    const validateInvite = async (t) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/auth/validate-invite?token=${t}`);
            if (res.data.valid) {
                setIsInviteValid(true);
                setEmail(res.data.email);
            }
        } catch (err) {
            setError('The invite link is invalid or has expired.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = { email };
            if (token) payload.token = token;

            await axios.post('http://localhost:5000/api/auth/register', payload);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center p-4 transition-colors duration-300">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-800 text-center transition-colors duration-300">
                    <div className="bg-green-50 dark:bg-green-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 dark:border-green-900/50">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase mb-4 transition-colors">Registration Successful!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium transition-colors">
                        We've sent a temporary password to <span className="text-red-600 dark:text-red-500 font-bold">{email}</span>.
                        Please check your email and use it to log in.
                    </p>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="w-full bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm uppercase tracking-widest text-sm"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="text-center mb-8">
                    <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase transition-colors">Create Account</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium transition-colors">
                        {token ? 'Staff invitation registration' : 'Staff self-service registration'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 flex items-center gap-2 transition-colors">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wide">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Internal Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isInviteValid}
                                className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-all font-medium ${isInviteValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="name@kra.go.ke"
                                required
                            />
                        </div>
                        {isInviteValid && (
                            <p className="text-xs text-green-600 dark:text-green-500 font-bold uppercase mt-2 transition-colors">Verified invitation source</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (token && !isInviteValid && !error)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? 'Processing...' : 'Get System Access'}
                    </button>
                    {!token && (
                        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                            Strictly for authorized personnel only
                        </p>
                    )}
                </form>

                <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6 transition-colors">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors">
                        Already have access?{' '}
                        <Link to="/login" className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold ml-1 transition-colors">
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

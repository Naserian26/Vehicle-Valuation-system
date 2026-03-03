import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Reset token is missing.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            await axios.post('http://localhost:5000/api/auth/reset-password', {
                token,
                new_password: newPassword
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center p-4 transition-colors duration-300">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-800 text-center transition-colors duration-300">
                    <div className="bg-red-50 dark:bg-red-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/50">
                        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase mb-2 transition-colors">Invalid Link</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium transition-colors">This password reset link is invalid or has expired.</p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="w-full bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm uppercase tracking-widest text-sm"
                    >
                        Request New Link
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
                        <Lock className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase transition-colors">Reset Password</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium transition-colors">Enter your new secure password below.</p>
                </div>

                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 text-green-600 dark:text-green-400 p-3 rounded-xl mb-6 flex items-center gap-2 transition-colors">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wide">Reset successful! Accessing login...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 flex items-center gap-2 transition-colors">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wide">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? 'Updating...' : 'Confirm Reset'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;

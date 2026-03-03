import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

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
            await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center p-4 transition-colors duration-300">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-800 text-center transition-colors duration-300">
                    <div className="bg-red-50 dark:bg-red-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/50">
                        <Mail className="w-12 h-12 text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase mb-4 transition-colors">Request Received</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium transition-colors">
                        If an account exists for <span className="text-red-600 dark:text-red-500 font-bold">{email}</span>,
                        we've sent instructions to reset your password.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Return to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="text-center mb-8">
                    <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase transition-colors">Forgot Password?</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium transition-colors">No worries, we'll send reset instructions.</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 flex items-center gap-2 transition-colors">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wide">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 transition-colors">Work Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-all font-medium"
                                placeholder="name@kra.go.ke"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? 'Processing...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6 transition-colors">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 font-bold transition-colors uppercase tracking-widest text-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

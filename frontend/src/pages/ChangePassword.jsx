import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';

const ChangePassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { updateMustChange, user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            await axios.post('http://localhost:5000/api/auth/change-password', { new_password: newPassword });
            setSuccess(true);
            updateMustChange(false);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                <div className="text-center mb-8">
                    <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Security Update</h1>
                    {user?.mustChangePassword ? (
                        <div className="mt-3 flex items-center justify-center gap-2 text-red-600 bg-red-50 py-2 rounded-lg border border-red-100 px-4">
                            <ShieldAlert className="w-4 h-4" />
                            <p className="text-xs font-bold uppercase tracking-wider">Mandatory password update required</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 mt-2 font-medium">Update your account password</p>
                    )}
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-100 text-green-600 p-3 rounded-xl mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wide">Update successful! Accessing system...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wide">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 outline-none transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 outline-none transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? 'Processing...' : 'Secure Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;

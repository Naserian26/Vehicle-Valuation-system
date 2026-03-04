import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';

const passwordRules = [
  { id: 'length',    label: 'At least 8 characters',       test: (p) => p.length >= 8 },
  { id: 'upper',     label: 'Uppercase letter (A–Z)',       test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',     label: 'Lowercase letter (a–z)',       test: (p) => /[a-z]/.test(p) },
  { id: 'number',    label: 'Number (0–9)',                 test: (p) => /[0-9]/.test(p) },
  { id: 'special',   label: 'Special character (!@#$...)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const ChangePassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

        if (!allPassed) {
            setError('Password does not meet all requirements.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            await axios.post('http://localhost:5000/api/auth/change-password', { new_password: newPassword });
            setSuccess(true);
            updateMustChange(false);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
                <div className="text-center mb-8">
                    <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight transition-colors">Security Update</h1>
                    {user?.mustChangePassword ? (
                        <div className="mt-3 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 py-2 rounded-lg border border-red-100 dark:border-red-900/50 px-4">
                            <ShieldAlert className="w-4 h-4" />
                            <p className="text-xs font-bold uppercase tracking-wider">Mandatory password update required</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium transition-colors">Update your account password</p>
                    )}
                </div>

                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 text-green-600 dark:text-green-400 p-3 rounded-xl mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wide">Update successful! Accessing system...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wide">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* Live password checklist */}
                        {newPassword.length > 0 && (
                            <div className="mt-3 space-y-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                {passwordRules.map(rule => {
                                    const passed = rule.test(newPassword);
                                    return (
                                        <div key={rule.id} className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${passed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                {passed && <CheckCircle className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className={`text-xs font-medium transition-colors ${passed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                {rule.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                className={`w-full bg-gray-50 dark:bg-gray-800 border text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:ring-1 outline-none transition-all font-medium ${
                                    confirmPassword.length > 0
                                        ? newPassword === confirmPassword
                                            ? 'border-green-400 dark:border-green-600 focus:ring-green-500'
                                            : 'border-red-400 dark:border-red-600 focus:ring-red-500'
                                        : 'border-gray-200 dark:border-gray-700 focus:ring-red-600'
                                }`}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 font-bold mt-1 uppercase">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success || !allPassed}
                        className="w-full bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                    >
                        {loading ? 'Processing...' : 'Secure Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
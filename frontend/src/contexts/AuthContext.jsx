import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('keval_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('keval_token');
        const storedRole = localStorage.getItem('keval_role');
        const storedEmail = localStorage.getItem('keval_email');
        const mustChange = localStorage.getItem('keval_must_change') === 'true';

        if (storedToken) {
            setUser({ role: storedRole, email: storedEmail, mustChangePassword: mustChange });
            setToken(storedToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }

        // Add interceptor to handle 401 Unauthorized
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );

        setLoading(false);

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = (newToken, role, email, mustChange) => {
        localStorage.setItem('keval_token', newToken);
        localStorage.setItem('keval_role', role);
        localStorage.setItem('keval_email', email);
        localStorage.setItem('keval_must_change', mustChange);

        setToken(newToken);
        setUser({ role, email, mustChangePassword: mustChange });
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateMustChange = (val) => {
        localStorage.setItem('keval_must_change', val);
        setUser(prev => ({ ...prev, mustChangePassword: val }));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, updateMustChange }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

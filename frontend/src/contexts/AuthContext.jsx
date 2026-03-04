import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT = 60 * 1000; // 1 minute
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('keval_token'));
    const [loading, setLoading] = useState(true);
    const inactivityTimer = useRef(null);

    const logout = useCallback(() => {
        localStorage.clear();
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        clearTimeout(inactivityTimer.current);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            logout();
            window.location.href = '/login';
        }, INACTIVITY_TIMEOUT);
    }, [logout]);

    // Start/stop inactivity tracking based on login state
    useEffect(() => {
        if (!user) return;

        // Start timer and listen for activity
        resetInactivityTimer();
        ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, resetInactivityTimer));

        return () => {
            clearTimeout(inactivityTimer.current);
            ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        };
    }, [user, resetInactivityTimer]);

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

        // Handle 401 Unauthorized
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
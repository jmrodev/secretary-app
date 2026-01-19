import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (storedToken && userData) {
            setUser(JSON.parse(userData));
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const res = await api.post('/auth/login', { username, password });
            const { token, ...userData } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setToken(token);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            let message = "Error connecting to server";
            if (error.response) {
                // Server responded with a status code outside 2xx range
                message = error.response.data || "Invalid credentials";
            } else if (error.request) {
                // Request was made but no response received
                message = "No response from server. Check your connection.";
            }
            return { success: false, message };
        }
    };

    const register = async (data) => {
        try {
            const res = await api.post('/auth/register', data);
            const { token, ...userData } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setToken(token);
            return true;
        } catch (error) {
            console.error("Register failed", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

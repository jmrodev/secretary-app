import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, AuthResponse } from '@/types/auth';
import { apiFetch, getAuthToken, getStoredUser } from '@/shared/services/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedToken = await getAuthToken();
                const storedUser = await getStoredUser();

                if (storedToken) {
                    setToken(storedToken);
                    setUser(storedUser);
                }
            } catch (err) {
                console.warn('Error reading auth state from storage:', err);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials: LoginCredentials): Promise<void> => {
        const response = await apiFetch<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (response.token) {
            const userObj: User = response.user || {
                id: response.user_id || response.id,
                username: response.username,
                role: response.role,
                name: response.name,
                doctor_id: response.doctor_id || (response.role === 'doctor' ? response.user_id : null),
                profile_id: response.profile_id || response.user_id,
            };
            await AsyncStorage.setItem('user_token', response.token);
            await AsyncStorage.setItem('user_info', JSON.stringify(userObj));
            setToken(response.token);
            setUser(userObj);
        } else {
            throw new Error(response.message || 'Error de autenticación');
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await AsyncStorage.multiRemove(['user_token', 'user_info']);
        } finally {
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!token,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

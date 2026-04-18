import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { authService } from '@/features/auth/authService';
import { authReducer, initialState, TOKEN_KEY, USER_KEY } from '@/features/auth/authReducer';

export const useAuthLogic = () => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // --- Private Helper: Centralizes success logic for login/register ---
    const handleAuthResponse = useCallback(async (actionFn, errorMsgDefault) => {
        try {
            const data = await actionFn();
            const { token, ...userData } = data;

            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));

            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, token } });
            return { success: true, user: userData };
        } catch (error) {
            console.error("Auth helper error:", error);
            const message = error.response?.data || errorMsgDefault;
            dispatch({ type: 'AUTH_ERROR', payload: message });
            return { success: false, message };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        dispatch({ type: 'LOGOUT' });
    }, []);

    const initAuth = useCallback(async () => {
        try {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                const userObj = JSON.parse(storedUser);
                dispatch({ type: 'AUTH_INIT', payload: { user: userObj, token: storedToken } });

                try {
                    const verifiedUser = await authService.verify();
                    const updatedUser = { ...userObj, ...verifiedUser };
                    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
                    dispatch({ type: 'AUTH_INIT', payload: { user: updatedUser, token: storedToken } });
                } catch (verifyError) {
                    logout();
                }
            } else {
                dispatch({ type: 'FINISH_LOADING' });
            }
        } catch (error) {
            logout();
        }
    }, [logout]);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // Public API (Simplified via Helper)
    const login = useCallback((u, p) => 
        handleAuthResponse(() => authService.login(u, p), "Invalid credentials"), 
    [handleAuthResponse]);

    const register = useCallback((data) => 
        handleAuthResponse(() => authService.register(data), "Registration failed"), 
    [handleAuthResponse]);

    const clearError = useCallback(() => {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    const authValue = useMemo(() => ({
        ...state,
        login,
        register,
        logout,
        clearError
    }), [state, login, register, logout, clearError]);

    return authValue;
};

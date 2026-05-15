import { createContext, use, useMemo } from 'react';
import { useAuthLogic } from '@/features/auth/useAuthLogic';

const AuthContext = createContext();

export const useAuth = () => use(AuthContext);

export const AuthProvider = ({ children }) => {
    const authValue = useAuthLogic();

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

import { createContext, useContext, useMemo } from 'react';
import { useAuthLogic } from './useAuthLogic';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const authValue = useAuthLogic();

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

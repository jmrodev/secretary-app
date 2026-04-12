import { createContext, useContext } from 'react';
import { useAuth } from '@/features/auth';
import { useConfigLogic } from './useConfigLogic';

const ConfigContext = createContext({ settings: {}, loading: true });

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        // Fallback to avoid crashes, though this should ideally be handled by provider
        return { settings: {}, loading: true };
    }
    return context;
};

export const ConfigProvider = ({ children }) => {
    const { user } = useAuth(); // Needed to check login status
    const value = useConfigLogic(user);

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

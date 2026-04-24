import { createContext, useContext } from 'react';
import { useAuth } from '@/features/auth';
import { useConfigLogic } from '@/context/useConfigLogic';

const defaultContextValue = {
    settings: { enable_office_rentals: 'true' },
    loading: true,
    updateSetting: () => {},
    refreshSettings: () => {},
};

const ConfigContext = createContext(defaultContextValue);

export const useConfig = () => {
    const ctx = useContext(ConfigContext);
    if (!ctx) return defaultContextValue;
    return ctx;
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

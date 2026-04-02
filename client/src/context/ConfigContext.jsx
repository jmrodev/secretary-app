import { createContext, useContext } from 'react';
import { useAuth } from '../features/auth';
import { useConfigLogic } from './useConfigLogic';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
    const { user } = useAuth(); // Needed to check login status
    const value = useConfigLogic(user);

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

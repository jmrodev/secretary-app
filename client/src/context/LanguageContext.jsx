import { createContext, useContext } from 'react';
<<<<<<< HEAD
import './LanguageContext.css';
import { useLanguageLogic } from './useLanguageLogic';
=======
import { useLanguageLogic } from '@/context/useLanguageLogic';
>>>>>>> main

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const value = useLanguageLogic();

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        // Fallback to avoid crashes if provider is missing
        return {
            language: 'es',
            setLanguage: () => { },
            toggleLanguage: () => { },
            t: (key) => key
        };
    }
    return context;
};

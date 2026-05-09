import { createContext, useContext } from 'react';
import { useLanguageLogic } from '@/context/useLanguageLogic';

const LanguageContext = createContext(null);
const LanguageActionsContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const { language, t, setLanguage, toggleLanguage } = useLanguageLogic();

    return (
        <LanguageContext.Provider value={{ language, t }}>
            <LanguageActionsContext.Provider value={{ setLanguage, toggleLanguage }}>
                {children}
            </LanguageActionsContext.Provider>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        return {
            language: 'es',
            t: (key) => key
        };
    }
    return context;
};

export const useLanguageActions = () => {
    const context = useContext(LanguageActionsContext);
    if (!context) {
        return {
            setLanguage: () => { },
            toggleLanguage: () => { }
        };
    }
    return context;
};

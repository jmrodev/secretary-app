import { useContext } from 'react';
import { LanguageContext, LanguageActionsContext } from '@/context/LanguageContext';

/**
 * Hook to consume LanguageContext (language and t function).
 */
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

/**
 * Hook to consume LanguageActionsContext (setLanguage and toggleLanguage).
 */
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

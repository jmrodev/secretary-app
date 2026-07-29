import React from 'react';
import { useLanguageLogic } from '@/context/useLanguageLogic';
import { LanguageContext, LanguageActionsContext } from './LanguageContext';

/**
 * LanguageProvider Context.
 * Manages internationalization state using custom logic.
 */
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

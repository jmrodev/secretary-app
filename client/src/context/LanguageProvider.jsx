import React, { useMemo } from 'react';
import { useLanguageLogic } from '@/context/useLanguageLogic';
import { LanguageContext, LanguageActionsContext } from './LanguageContext';

/**
 * LanguageProvider Context.
 * Manages internationalization state using custom logic.
 */
export const LanguageProvider = ({ children }) => {
    const { language, t, setLanguage, toggleLanguage } = useLanguageLogic();

    const langValue = useMemo(() => ({ language, t }), [language, t]);
    const langActions = useMemo(() => ({ setLanguage, toggleLanguage }), [setLanguage, toggleLanguage]);

    return (
        <LanguageContext.Provider value={langValue}>
            <LanguageActionsContext.Provider value={langActions}>
                {children}
            </LanguageActionsContext.Provider>
        </LanguageContext.Provider>
    );
};

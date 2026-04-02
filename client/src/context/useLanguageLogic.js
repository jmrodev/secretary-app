import { useState, useMemo, useCallback } from 'react';
import { translations } from '../constants/translations';

export const useLanguageLogic = () => {
    // Default to 'es' (Spanish)
    const [language, setLanguage] = useState('es');

    const t = useCallback((key) => {
        return translations[language][key] || key;
    }, [language]);

    const toggleLanguage = useCallback(() => {
        setLanguage(prev => prev === 'es' ? 'en' : 'es');
    }, []);

    const value = useMemo(() => ({
        language,
        setLanguage,
        toggleLanguage,
        t
    }), [language, t, toggleLanguage]);

    return value;
};

import { useState, useMemo, useCallback, useEffect } from 'react';
import { translations } from '../constants/translations';

const LANGUAGE_KEY = 'medicare_preferred_language';

export const useLanguageLogic = () => {
    // Default to 'es' (Spanish) or stored value
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem(LANGUAGE_KEY) || 'es';
    });

    // Persist language change
    useEffect(() => {
        localStorage.setItem(LANGUAGE_KEY, language);
    }, [language]);

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

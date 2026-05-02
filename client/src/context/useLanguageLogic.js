import { useState, useMemo, useCallback, useEffect } from 'react';
import { translations } from '@/constants/translations';

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

    const t = useCallback((key, params = {}) => {
        let text = translations[language]?.[key] || key;
        
        // Handle variable interpolation: {variable_name} -> params.variable_name
        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(new RegExp(`{${k}}`, 'g'), v);
            });
        }
        
        return text;
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

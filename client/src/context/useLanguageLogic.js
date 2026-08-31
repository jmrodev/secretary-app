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

    const t = useCallback((key, params = null, fallback = null) => {
        const langData = translations[language] || {};
        const defaultData = translations['es'] || {};
        let text = langData[key] ?? defaultData[key] ?? fallback ?? key;
        
        if (params && typeof params === 'object') {
            // Using a single pass replacement if possible, or simple split/join for speed
            for (const k in params) {
                if (Object.prototype.hasOwnProperty.call(params, k)) {
                    text = text.split(`{${k}}`).join(params[k]);
                }
            }
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

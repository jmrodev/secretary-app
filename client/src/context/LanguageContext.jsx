import { createContext, useContext, useState } from 'react';
import { translations } from '../constants/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    // Default to 'es' (Spanish)
    const [language, setLanguage] = useState('es');

    const t = (key) => {
        return translations[language][key] || key;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'es' ? 'en' : 'es');
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

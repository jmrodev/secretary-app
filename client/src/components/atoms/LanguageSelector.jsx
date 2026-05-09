import React from 'react';
import { useLanguage, useLanguageActions } from '@/context/LanguageContext';
import Button from '@/components/atoms/Button';
import './LanguageSelector.css';

/**
 * LanguageSelector Atom follows Atomic Design & BEM.
 * Removed Tailwind utility classes.
 */
const LanguageSelector = () => {
    const { language } = useLanguage();
    const { toggleLanguage } = useLanguageActions();

    return (
        <div className="language-selector">
            <Button
                variant="ghost"
                className="language-selector__button"
                onClick={toggleLanguage}
                title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
                <span className="language-selector__icon">
                    {language === 'es' ? '🇪🇸' : '🇺🇸'}
                </span>
                <span className="language-selector__text">
                    {language === 'es' ? 'Español' : 'English'}
                </span>
            </Button>
        </div>
    );
};

export default LanguageSelector;

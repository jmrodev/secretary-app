import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Button from './Button';

/**
 * Atom component for switching languages.
 * Follows Atomic Design principles.
 * Uses BEM naming convention: .language-selector
 */
const LanguageSelector = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <div className="language-selector">
            <Button
                variant="ghost"
                className="language-selector__button w-full justify-start !px-3"
                onClick={toggleLanguage}
                title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
                <span className="language-selector__icon text-xl mr-2">
                    {language === 'es' ? '🇪🇸' : '🇺🇸'}
                </span>
                <span className="language-selector__text text-sm font-medium text-slate-600">
                    {language === 'es' ? 'Español' : 'English'}
                </span>
            </Button>
        </div>
    );
};

export default LanguageSelector;

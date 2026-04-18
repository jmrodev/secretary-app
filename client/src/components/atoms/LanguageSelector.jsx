import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
<<<<<<< HEAD
import Button from './Button';
import Icon from './Icon';
=======
import Button from '@/components/atoms/Button';
>>>>>>> main
import './LanguageSelector.css';

/**
 * LanguageSelector Atom follows Atomic Design & BEM.
 * Removed Tailwind utility classes.
 */
const LanguageSelector = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <div className="language-selector">
            <Button
                variant="ghost"
                className="language-selector__button"
                onClick={toggleLanguage}
                title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                icon={<Icon name="LANGUAGE" />}
            >
                <span className="language-selector__text">
                    {language === 'es' ? 'ES' : 'EN'}
                </span>
            </Button>
        </div>
    );
};

export default LanguageSelector;

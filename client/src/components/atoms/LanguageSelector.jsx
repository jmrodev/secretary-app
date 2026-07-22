import React from 'react';
import { Button } from '@/components/atoms/Button';
import styles from './LanguageSelector.module.css';

/**
 * LanguageSelector Atom follows Atomic Design & BEM.
 * Removed Tailwind utility classes.
 * Receives language state and toggle function via props.
 */
const LanguageSelector = ({ currentLanguage, onToggleLanguage, switchTitle }) => {
    return (
        <div className={`${styles.root}`}>
            <Button
                variant="ghost"
                className={`${styles.button}`}
                onClick={onToggleLanguage}
                title={switchTitle}
            >
                <span className={`${styles.icon}`}>
                    {currentLanguage === 'es' ? '🇦🇷' : '🇺🇸'}
                </span>
                <span className={`${styles.text}`}>
                    {currentLanguage === 'es' ? 'Español' : 'English'}
                </span>
            </Button>
        </div>
    );
};

export default LanguageSelector;

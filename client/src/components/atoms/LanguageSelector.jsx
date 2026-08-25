import React from 'react';
import { Button } from '@/components/atoms/Button';
import styles from './LanguageSelector.module.css';

/**
 * LanguageSelector Atom follows Atomic Design & BEM.
 * Removed Tailwind utility classes.
 * Receives language state and toggle function via props.
 */
export const LanguageSelector = ({ currentLanguage, onToggleLanguage, switchTitle }) => {
    return (
        <div className={`${styles.LanguageSelector__root}`}>
            <Button
                variant="ghost"
                className={`${styles.LanguageSelector__button}`}
                onClick={onToggleLanguage}
                title={switchTitle}
            >
                <span className={`${styles.LanguageSelector__icon}`}>
                    {currentLanguage === 'es' ? '🇪🇸' : '🇺🇸'}
                </span>
                <span className={`${styles.LanguageSelector__text}`}>
                    {currentLanguage === 'es' ? 'Español' : 'English'}
                </span>
            </Button>
        </div>
    );
};

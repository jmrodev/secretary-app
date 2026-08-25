import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './ThemeToggle.module.css';

const THEMES = ['dark', 'dim', 'light'];

export const ThemeToggle = ({ className = '' }) => {
    const { t } = useLanguage();
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        
        // Remove old classes
        THEMES.forEach(tName => {
            document.body.classList.remove(`theme-${tName}`);
        });
        
        // Add new theme
        root.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        document.body.classList.add(`theme-${theme}`);
        
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            const nextIndex = (THEMES.indexOf(prev) + 1) % THEMES.length;
            return THEMES[nextIndex];
        });
    };

    const getIcon = () => {
        if (theme === 'light') return 'light_mode';
        if (theme === 'dim') return 'contrast'; // or some intermediate icon
        return 'dark_mode';
    };
    
    const getLabel = () => {
        if (theme === 'light') return t('chalk_mode') || 'Modo Tiza';
        if (theme === 'dim') return t('soft_mode') || 'Modo Suave';
        return t('dark_mode') || 'Modo Oscuro';
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={t('change_theme_mode') || 'Cambiar modo de tema'}
            title={`${t('current_theme') || 'Tema actual'}: ${getLabel()}`}
            className={`${styles.ThemeToggle__toggle} ${className}`}
            icon={<Icon name={getIcon()} size="1.1rem" />}
        >
            {getLabel()}
        </Button>
    );
};

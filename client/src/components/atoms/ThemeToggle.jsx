import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import Icon from './Icon';
import styles from './ThemeToggle.module.css';

const ThemeToggle = ({ className = '' }) => {
    const themes = ['dark', 'dim', 'light'];
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        
        // Remove old classes
        themes.forEach(t => {
            document.body.classList.remove(`theme-${t}`);
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
            const nextIndex = (themes.indexOf(prev) + 1) % themes.length;
            return themes[nextIndex];
        });
    };

    const getIcon = () => {
        if (theme === 'light') return 'light_mode';
        if (theme === 'dim') return 'contrast'; // or some intermediate icon
        return 'dark_mode';
    };
    
    const getLabel = () => {
        if (theme === 'light') return 'Modo Tiza';
        if (theme === 'dim') return 'Modo Suave';
        return 'Modo Oscuro';
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label="Cambiar modo de tema"
            title={`Tema actual: ${getLabel()}`}
            className={`${styles.toggle} ${className}`}
            icon={<Icon name={getIcon()} size="1.1rem" />}
        >
            {getLabel()}
        </Button>
    );
};

export default ThemeToggle;

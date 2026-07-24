import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import Icon from './Icon';
import styles from './ThemeToggle.module.css';

const ThemeToggle = ({ className = '' }) => {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
            document.body.setAttribute('data-theme', 'light');
            document.body.classList.add('theme-light');
        } else {
            root.setAttribute('data-theme', 'dark');
            document.body.setAttribute('data-theme', 'dark');
            document.body.classList.remove('theme-light');
        }
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const isLight = theme === 'light';

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label="Cambiar modo de tema"
            title={isLight ? 'Cambiar a modo Oscuro' : 'Cambiar a modo Tiza (Claro)'}
            className={`${styles.toggle} ${className}`}
            icon={<Icon name={isLight ? 'dark_mode' : 'light_mode'} size="1.1rem" />}
        >
            {isLight ? 'Modo Oscuro' : 'Modo Tiza'}
        </Button>
    );
};

export default ThemeToggle;

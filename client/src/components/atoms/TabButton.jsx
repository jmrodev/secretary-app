import React from 'react';
import { Button } from '@/components/atoms/Button';
import styles from './TabButton.module.css';

export const TabButton = ({
    children,
    isActive,
    onClick,
    variant = 'pill', // 'underline' | 'pill'
    activeColor = 'blue', // 'blue' | 'purple' | 'green' | 'amber' | 'default'
    className = ''
}) => {
    const colorKey = `TabButton__tabBtn--${activeColor}`;

    const combinedClassName = [
        styles.TabButton__tabBtn,
        variant === 'underline' && isActive && styles[`TabButton__tabBtn--underline-${activeColor}`],
        isActive && styles['TabButton__tabBtn--active'],
        isActive && styles[colorKey],
        className
    ].filter(Boolean).join(' ');

    return (
        <Button
            type="button"
            className={combinedClassName}
            onClick={onClick}
            unstyled
        >
            {children}
        </Button>
    );
};

import React from 'react';
import { Button } from '@/components/atoms/Button';
import styles from './TabButton.module.css';

const TabButton = ({
    children,
    isActive,
    onClick,
    variant = 'pill', // 'underline' | 'pill'
    activeColor = 'blue', // 'blue' | 'purple' | 'green' | 'amber' | 'default'
    className = ''
}) => {
    const colorKey = `tabBtn${activeColor.charAt(0).toUpperCase() + activeColor.slice(1)}`;
    
    const combinedClassName = [
        styles.tabBtn,
        variant === 'underline' && styles.tabBtnUnderline,
        isActive && styles.tabBtnActive,
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

export default TabButton;

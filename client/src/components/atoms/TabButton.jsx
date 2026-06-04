import React from 'react';
import Button from '@/components/atoms/Button';
import styles from './TabButton.module.css';

const TabButton = ({
    children,
    isActive,
    onClick,
    variant = 'pill', // 'underline' | 'pill'
    activeColor = 'blue', // 'blue' | 'purple' | 'green' | 'amber' | 'default'
    className = ''
}) => {
    const baseClass = styles.tabBtn;

    const variantClass = `${baseClass}--${variant}`;
    const colorClass = isActive ? `${baseClass}--${activeColor}` : '';
    const activeClass = isActive ? `${baseClass}--active` : '';

    const combinedClassName = `
        ${baseClass} 
        ${variantClass} 
        ${colorClass} 
        ${activeClass} 
        ${className}
    `.trim().replace(/\s+/g, ' ');

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

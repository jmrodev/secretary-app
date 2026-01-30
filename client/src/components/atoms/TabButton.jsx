import React from 'react';
import './TabButton.css';

const TabButton = ({
    children,
    isActive,
    onClick,
    variant = 'pill', // 'underline' | 'pill'
    activeColor = 'blue', // 'blue' | 'purple' | 'green' | 'amber' | 'default'
    className = ''
}) => {
    const baseClass = 'tab-btn';

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
        <button
            className={combinedClassName}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default TabButton;

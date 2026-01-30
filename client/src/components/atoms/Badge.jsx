import React from 'react';
import './Badge.css';

const Badge = ({
    children,
    variant = 'default', // default, danger, success, warning, blue, accent, status-pending, etc.
    className = '',
    onClick = null,
    title = ''
}) => {
    const baseClass = 'badge';

    // Normalize variant for BEM
    // Support legacy "status-" or "chip-" if needed, but moving towards "badge--variant"
    const normalizedVariant = variant.replace('status-', '').replace('chip-', '');
    const variantClass = `${baseClass}--${normalizedVariant}`;
    const interactiveClass = onClick ? `${baseClass}--interactive` : '';

    return (
        <span
            className={`${baseClass} ${variantClass} ${interactiveClass} ${className}`}
            onClick={onClick}
            title={title}
        >
            {children}
        </span>
    );
};

export default Badge;

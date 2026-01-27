import React from 'react';

const Badge = ({
    children,
    variant = 'gray',
    className = '',
    onClick = null
}) => {
    // Map role/status names to status-chip classes if common
    let variantClass = 'status-chip';

    if (variant.startsWith('status-')) {
        variantClass = variant; // Full class provided (legacy)
    } else if (variant.startsWith('chip-')) {
        variantClass = `status-chip ${variant}`; // e.g., "status-chip chip-blue"
    } else {
        variantClass = `status-chip status-${variant}`; // e.g., "status-chip status-pending"
    }

    return (
        <span
            className={`${variantClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {children}
        </span>
    );
};

export default Badge;

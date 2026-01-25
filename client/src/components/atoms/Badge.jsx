import React from 'react';

const Badge = ({
    children,
    variant = 'gray',
    className = '',
    onClick = null
}) => {
    // Map role/status names to status-chip classes if common
    const variantClass = variant.startsWith('status-') ? variant : `status-chip status-${variant}`;

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

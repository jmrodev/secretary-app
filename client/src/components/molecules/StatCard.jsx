import React from 'react';

const StatCard = ({
    icon,
    label,
    value,
    variant = 'default', // 'default' | 'accent' | 'dark'
    className = ''
}) => {
    const baseClass = 'stat-card';
    const variantClass = variant !== 'default' ? `${baseClass}--${variant}` : '';

    return (
        <div className={`${baseClass} ${variantClass} ${className}`}>
            <div className={`${baseClass}__header`}>
                <span className={`${baseClass}__icon`}>{icon}</span>
                <span className={`${baseClass}__label`}>{label}</span>
            </div>
            <div className={`${baseClass}__value`}>
                {value}
            </div>
        </div>
    );
};

export default StatCard;

import React from 'react';
import Icon from '../../../components/atoms/Icon';
import './StatCard.css';

/**
 * StatCard Molecule (Feature Component).
 * Displays a statistic with an icon, label, and value.
 * Used primary within the Dashboard context.
 */
const StatCard = ({
    icon, // Material symbol name
    label,
    value,
    variant = 'default', // 'default' | 'accent' | 'dark'
    size = 'md', // 'sm' | 'md'
    className = ''
}) => {
    const baseClass = 'stat-card';
    const variantClass = variant !== 'default' ? `${baseClass}--${variant}` : '';
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';

    return (
        <div className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}>
            <div className={`${baseClass}__header`}>
                <div className={`${baseClass}__icon-wrapper`}>
                    <Icon name={icon} size="1.25rem" />
                </div>
                <span className={`${baseClass}__label`}>{label}</span>
            </div>
            <div className={`${baseClass}__value`}>
                {value}
            </div>
        </div>
    );
};

export default StatCard;

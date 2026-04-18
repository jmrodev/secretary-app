import React from 'react';
import Icon from '@/components/atoms/Icon';
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
    variant = 'default', // 'default' | 'accent' | 'dark' | 'success' | 'warning'
    size = 'md', // 'sm' | 'md' | 'lg'
    layout = 'card', // 'card' | 'list'
    trend = null, // e.g., '+12%'
    trendLabel = '', // e.g., 'vs ayer'
    className = ''
}) => {
    const baseClass = 'stat-card';
    const variantClass = variant !== 'default' ? `${baseClass}--${variant}` : '';
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';
    const layoutClass = `${baseClass}--${layout}`;

    return (
        <article className={`${baseClass} ${variantClass} ${sizeClass} ${layoutClass} ${className}`}>
            <div className={`${baseClass}__header`}>
                <div className={`${baseClass}__icon-wrapper`}>
                    <Icon name={icon} size={(size === 'sm' || layout === 'list') ? '1rem' : '1.5rem'} />
                </div>
                <div className={`${baseClass}__label-group`}>
                    <h3 className={`${baseClass}__label`}>{label}</h3>
                    {trend && (
                        <div className={`${baseClass}__trend`}>
                            <span className={`${baseClass}__trend-value`}>{trend}</span>
                            {trendLabel && <span className={`${baseClass}__trend-label`}>{trendLabel}</span>}
                        </div>
                    )}
                </div>
            </div>
            <div className={`${baseClass}__value`}>
                {value}
            </div>
        </article>
    );
};

export default StatCard;

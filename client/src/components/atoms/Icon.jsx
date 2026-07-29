import React from 'react';
import { ICONS } from '@/constants/icons';
import styles from './Icon.module.css';

/**
 * Icon Atom component.
 * Uses Material Symbols Outlined.
 * Supports semantic names from ICONS configuration.
 */
const Icon = ({
    name,
    className = '',
    size = 'inherit',
    color = 'currentColor',
    onIconClick
}) => {
    // Determine the symbol name: use ICONS mapping if available, otherwise use name as is
    const symbol = ICONS[name] || name;

    const style = {
        fontSize: size,
        color: color
    };

    const combinedClasses = [
        'material-symbols-outlined',
        styles.root,
        onIconClick ? styles.clickable : '',
        className
    ].filter(Boolean).join(' ');

    const handleKeyDown = (e) => {
        if (onIconClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onIconClick(e);
        }
    };

    if (onIconClick) {
        return (
            <button
                type="button"
                className={combinedClasses}
                style={{ ...style, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={onIconClick}
                onKeyDown={handleKeyDown}
                aria-label={typeof name === 'string' ? name.toLowerCase().replace(/_/g, ' ') : styles.root}
            >
                {symbol}
            </button>
        );
    }

    return (
        <span
            className={combinedClasses}
            style={style}
            role="presentation"
            aria-hidden="true"
        >
            {symbol}
        </span>
    );
};

export default Icon;

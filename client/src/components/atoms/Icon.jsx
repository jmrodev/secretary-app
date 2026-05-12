import React from 'react';
import { ICONS } from '@/constants/icons';
import './Icon.css';

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
        'icon',
        onIconClick ? 'icon--clickable' : '',
        className
    ].filter(Boolean).join(' ');

    const handleKeyDown = (e) => {
        if (onIconClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onIconClick(e);
        }
    };

    return (
        <span
            className={combinedClasses}
            style={style}
            onClick={onIconClick}
            onKeyDown={handleKeyDown}
            role={onIconClick ? 'button' : undefined}
            tabIndex={onIconClick ? 0 : undefined}
            aria-hidden={!onIconClick}
        >
            {symbol}
        </span>
    );
};

export default Icon;

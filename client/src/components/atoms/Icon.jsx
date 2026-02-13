import React from 'react';
import { ICONS } from '../../constants/icons';
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
        color: color,
        cursor: onIconClick ? 'pointer' : 'inherit'
    };

    return (
        <span
            className={`material-symbols-outlined icon ${className}`}
            style={style}
            onClick={onIconClick}
        >
            {symbol}
        </span>
    );
};

export default Icon;

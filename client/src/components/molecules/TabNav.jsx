import React from 'react';
import './TabNav.css';

/**
 * TabNav molecule.
 * Container for TabButton atoms.
 */
const TabNav = ({ children, className = '' }) => {
    return (
        <nav className={`tab-nav ${className}`}>
            {children}
        </nav>
    );
};

export default TabNav;

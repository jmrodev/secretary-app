import React from 'react';
import styles from './TabNav.module.css';

/**
 * TabNav molecule.
 * Container for TabButton atoms.
 */
const TabNav = ({ children, className = '' }) => {
    return (
        <nav className={`${styles.tabNav} ${className}`}>
            {children}
        </nav>
    );
};

export default TabNav;

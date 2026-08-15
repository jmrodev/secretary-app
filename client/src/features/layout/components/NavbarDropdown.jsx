import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from './Navbar.module.css';

/**
 * NavbarDropdown (Molecule).
 * Managed dropdown for the navigation menu.
 */
export const NavbarDropdown = React.memo(({ label, isOpen, onToggle, children }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
        }
    };

    return (
        <div className={`${styles.Navbar__dropdown} ${isOpen ? styles.Navbar__dropdownOpen : ''}`}>
            <div 
                className={styles.Navbar__dropdownTrigger} 
                onClick={onToggle}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
            >
                {label}
                <Icon name={isOpen ? 'EXPAND_LESS' : 'EXPAND_MORE'} size="1rem" />
            </div>
            {isOpen && (
                <div className={styles.Navbar__dropdownContent}>
                    {children}
                </div>
            )}
        </div>
    );
});

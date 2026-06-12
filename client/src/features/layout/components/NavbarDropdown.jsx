import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from './Navbar.module.css';

/**
 * NavbarDropdown (Molecule).
 * Managed dropdown for the navigation menu.
 */
const NavbarDropdown = ({ label, isOpen, onToggle, children }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
        }
    };

    return (
        <div className={`${styles.dropdown} ${isOpen ? styles.dropdownOpen : ''}`}>
            <div 
                className={styles.dropdownTrigger} 
                onClick={onToggle}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
            >
                {label}
                <Icon name={isOpen ? 'EXPAND_LESS' : 'EXPAND_MORE'} size="1rem" />
            </div>
            {isOpen && (
                <div className={styles.dropdownContent}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default React.memo(NavbarDropdown);

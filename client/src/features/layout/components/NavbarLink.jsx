import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

/**
 * NavbarLink (Atom).
 * Standardized link for the top navigation.
 */
export const NavbarLink = React.memo(({ to, label, isActive, onClick, icon }) => {
    const className = `${styles.Navbar__link} ${isActive ? styles.Navbar__linkActive : ''}`;
    
    return (
        <Link to={to} className={className} onClick={onClick}>
            {icon}
            {label}
        </Link>
    );
});

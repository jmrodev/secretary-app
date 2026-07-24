import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

/**
 * NavbarLink (Atom).
 * Standardized link for the top navigation.
 */
const NavbarLink = ({ to, label, isActive, onClick, icon }) => {
    const className = `${styles.link} ${isActive ? styles.linkActive : ''}`;
    
    return (
        <Link to={to} className={className} onClick={onClick}>
            {icon}
            {label}
        </Link>
    );
};

export default React.memo(NavbarLink);

import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon';
import styles from './NavbarCategoryDropdown.module.css';

export const NavbarCategoryDropdown = ({
    label,
    icon,
    items = [],
    isActive = false,
    isOpen = false,
    onToggle
}) => {
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onToggle(null);
            }
        };
        const handleKeyDown = (e) => {
            if (isOpen && e.key === 'Escape') {
                onToggle(null);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onToggle]);

    const visibleItems = items.filter(item => item && item.show !== false);
    if (visibleItems.length === 0) return null;

    return (
        <div className={styles.NavbarCategoryDropdown__root} ref={dropdownRef}>
            <button
                type="button"
                className={`${styles.NavbarCategoryDropdown__trigger} ${isActive ? styles.NavbarCategoryDropdown__triggerActive : ''}`}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {icon && <Icon name={icon} size="1.1rem" />}
                <span>{label}</span>
                <div className={`${styles.NavbarCategoryDropdown__chevron} ${isOpen ? styles.NavbarCategoryDropdown__chevronRotated : ''}`}>
                    <Icon name="expand_more" size="0.95rem" />
                </div>
            </button>

            {isOpen && (
                <div className={styles.NavbarCategoryDropdown__panel} role="menu">
                    {visibleItems.map(item => {
                        if (item.external) {
                            return (
                                <a
                                    key={item.path}
                                    href={item.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.NavbarCategoryDropdown__link}
                                    onClick={() => onToggle(null)}
                                >
                                    {item.icon && <Icon name={item.icon} size="1.05rem" />}
                                    <span>{item.label}</span>
                                </a>
                            );
                        }
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`${styles.NavbarCategoryDropdown__link} ${item.isActive ? styles.NavbarCategoryDropdown__linkActive : ''}`}
                                onClick={() => onToggle(null)}
                            >
                                {item.icon && <Icon name={item.icon} size="1.05rem" />}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

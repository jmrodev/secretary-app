import React from 'react';
import { Link } from 'react-router-dom';
import Loading from './Loading';
import styles from './Button.module.css';

/**
 * Button Atom component (ECC Refactored).
 * Follows Atomic Design and ensures prop integrity.
 */
export const Button = React.memo(({
    children,
    onClick,
    to,
    type = 'button',
    variant = 'primary', 
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    title = '',
    tooltip = null,
    icon = null,
    iconRight = null,
    active = false,
    unstyled = false,
    outline = false,
    round = false,
    target = '_self',
    rel = 'noopener noreferrer',
    ...rest
}) => {
    // ECC: Use native array mapping for clean CSS Module class management
    const isIconOnly = !children && icon;
    
    const combinedClassName = unstyled ? className : [
        styles.root,
        variant && styles[variant],
        size && size !== 'md' && styles[size],
        active && styles.active,
        isIconOnly && styles.iconOnly,
        round && styles.round, // Support for round prop
        loading && styles.loading,
        className
    ].filter(Boolean).join(' ');

    const content = (
        <>
            {loading && <Loading size="sm" variant="inline" className={styles.spinner} />}
            {!loading && icon && <span className={styles.icon}>{icon}</span>}
            {children && <span className={styles.content}>{children}</span>}
            {!loading && iconRight && <span className={styles.icon}>{iconRight}</span>}
        </>
    );

    const isExternal = to && (
        to.startsWith('http') || 
        to.startsWith('tel:') || 
        to.startsWith('mailto:') || 
        to.startsWith('whatsapp:') || 
        to.startsWith('/uploads') || 
        target === '_blank'
    );

    // ECC: Props for the underlying element
    const elementProps = {
        className: combinedClassName,
        title,
        'data-tooltip': tooltip,
        onClick: (e) => {
            if (disabled || loading) {
                e.preventDefault();
                return;
            }
            if (onClick) onClick(e);
        },
        ...rest
    };

    if (to && !isExternal) {
        return (
            <Link to={to} {...elementProps}>
                {content}
            </Link>
        );
    }

    if (to && isExternal) {
        return (
            <a href={to} target={target} rel={rel} {...elementProps}>
                {content}
            </a>
        );
    }

    return (
        <button type={type} disabled={disabled || loading} {...elementProps}>
            {content}
        </button>
    );
});



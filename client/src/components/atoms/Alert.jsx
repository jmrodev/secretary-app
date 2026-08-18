import React from 'react';
import styles from './Alert.module.css';

/**
 * Alert Atom follows Atomic Design & BEM.
 */
export const Alert = ({
    variant = 'info',
    title,
    message,
    children,
    className = ''
}) => {
    const baseClass = styles.root;
    const variantClass = `${baseClass}--${variant}`;

    return (
        <div className={`${baseClass} ${variantClass} ${className}`}>
            {title && <h4 className={`${baseClass}__title`}>{title}</h4>}
            {message && <p className={`${baseClass}__message`}>{message}</p>}
            {children && <div className={`${baseClass}__message`}>{children}</div>}
        </div>
    );
};

import React from 'react';
import styles from './StatusIndicator.module.css';

/**
 * StatusIndicator Atom follows Atomic Design & BEM.
 */
export const StatusIndicator = ({ status, label, className = '' }) => {
    const baseClass = styles.root;
    const statusClass = `${baseClass}--${status}`;

    return (
        <div className={`${baseClass} ${statusClass} ${className}`}>
            <span className={`${baseClass}__dot`} aria-hidden="true"></span>
            <span className={`${baseClass}__label`}>{label}</span>
        </div>
    );
};

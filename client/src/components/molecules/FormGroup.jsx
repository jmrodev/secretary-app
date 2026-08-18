import React from 'react';
import styles from './FormGroup.module.css';

export const FormGroup = ({ label, children, error, required = false, className = '' }) => {
    return (
        <div className={`${styles.root} ${required ? styles.required : ''} ${className}`.trim()}>
            {label && (
                <label className={styles.label}>
                    {label}
                </label>
            )}
            <div className={styles.content}>
                {children}
            </div>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
};


import React from 'react';
import styles from './FormGroup.module.css';

export const FormGroup = ({ label, children, error, required = false, className = '', htmlFor }) => {
    return (
        <div className={`${styles.FormGroup__root} ${required ? styles.FormGroup__required : ''} ${className}`.trim()}>
            {label && (
                <label htmlFor={htmlFor} className={styles.FormGroup__label}>
                    {label}
                </label>
            )}
            <div className={styles.FormGroup__content}>
                {children}
            </div>
            {error && <p className={styles.FormGroup__error}>{error}</p>}
        </div>
    );
};


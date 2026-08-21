import React from 'react';
import styles from './Checkbox.module.css';

/**
 * Checkbox Atom follows Atomic Design & BEM.
 * Renders a hidden native checkbox plus a styled indicator,
 * mirroring the shape of Switch.jsx (label wrapper + hidden input + indicator).
 */
export const Checkbox = ({ id, checked, onChange, disabled, label, className = '' }) => {
    const baseClass = styles.Checkbox__root;
    const disabledClass = disabled ? `${baseClass}--disabled` : '';

    return (
        <label className={`${baseClass} ${disabledClass} ${className}`.trim()}>
            <input
                className={`${styles.Checkbox__input}`}
                type="checkbox"
                id={id}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
            />
            <span className={`${styles.Checkbox__indicator}`}></span>
            {label && (
                <span className={`${styles.Checkbox__label}`}>
                    {label}
                </span>
            )}
        </label>
    );
};

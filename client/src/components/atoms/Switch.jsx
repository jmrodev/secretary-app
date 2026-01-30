import React from 'react';
import './Switch.css';

/**
 * Switch Atom follows Atomic Design & BEM.
 * Removed Tailwind utility classes.
 */
const Switch = ({ id, checked, onChange, disabled, label, className = '' }) => {
    const baseClass = 'switch';
    const disabledClass = disabled ? `${baseClass}--disabled` : '';

    return (
        <label className={`${baseClass} ${disabledClass} ${className}`}>
            <div className={`${baseClass}__toggle`}>
                <input
                    className={`${baseClass}__input`}
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                />
                <span className={`${baseClass}__slider`}></span>
            </div>
            {label && (
                <span className={`${baseClass}__label`}>
                    {label}
                </span>
            )}
        </label>
    );
};

export default Switch;

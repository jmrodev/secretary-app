import React from 'react';
import styles from './Input.module.css';

/**
 * Input Atom.
 * Renders a text input, textarea, or any other input type.
 * Accepts all native HTML input props via `...rest`
 * (checked, autoFocus, readOnly, accept, tabIndex, min, max, etc.)
 */
export const Input = ({
    type = 'text',
    value,
    onChange,
    placeholder = '',
    className = '',
    disabled = false,
    id,
    name,
    required = false,
    rows = 3,
    variant = 'default', // 'default' | 'error' | 'success'
    size = 'md',         // 'sm' | 'md' | 'lg'
    htmlSize,            // Native HTML size attribute
    ...rest              // forwards: checked, autoFocus, readOnly, accept, tabIndex, min, max, etc.
}) => {
    const baseClass = styles.root;

    const variantClass = variant !== 'default' && styles[variant] ? styles[variant] : '';
    const sizeClass = size !== 'md' && styles[size] ? styles[size] : '';
    const typeClass = type === 'textarea' && styles.textarea ? styles.textarea : '';

    const combinedClassName = `
        ${baseClass} 
        ${variantClass} 
        ${sizeClass} 
        ${typeClass}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    if (type === 'textarea') {
        return (
            <textarea
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={combinedClassName}
                disabled={disabled}
                required={required}
                rows={rows}
                {...rest}
            />
        );
    }

    return (
        <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={combinedClassName}
            disabled={disabled}
            required={required}
            size={htmlSize}
            {...rest}
        />
    );
};

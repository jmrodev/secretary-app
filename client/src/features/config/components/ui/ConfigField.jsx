import React from 'react';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import styles from './ConfigField.module.css';

/**
 * ConfigField Molecule (Feature Component).
 * Renders a labeled input or select field used across system preferences.
 * Supports more robust validation and styling via Atoms.
 */
const EMPTY_OPTIONS = [];

export const ConfigField = ({
    label,
    hint,
    type = 'text',
    value,
    onChange,
    disabled = false,
    placeholder = '',
    id,
    variant = '', // e.g., 'monospace'
    className = '',
    options = EMPTY_OPTIONS, // Only used if type="select"
    readOnly = false,
    rows = 3,
    ...rest
}) => {
    const isSelect = type === 'select';
    const variantClass = variant === 'monospace'
        ? (styles['ConfigField--monospace'] || 'ConfigField--monospace')
        : (variant ? (styles[`ConfigField--${variant}`] || `ConfigField--${variant}`) : '');
    const rootClass = `${styles.ConfigField__root} ${variantClass} ${className}`.trim();
    const inputClassName = `${styles.ConfigField__input}`.trim();

    return (
        <div className={rootClass}>
            {label && (
                <label className={styles.ConfigField__label} htmlFor={id}>
                    {label}
                </label>
            )}
            
            {isSelect ? (
                <Select
                    id={id}
                    value={value}
                    options={options}
                    onChange={onChange}
                    disabled={disabled}
                    className={inputClassName}
                />
            ) : (
                <Input
                    type={type}
                    id={id}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={inputClassName}
                    readOnly={readOnly}
                    rows={rows}
                    {...rest}
                />
            )}

            {hint && (
                <span className={styles.ConfigField__hint}>{hint}</span>
            )}
        </div>
    );
};

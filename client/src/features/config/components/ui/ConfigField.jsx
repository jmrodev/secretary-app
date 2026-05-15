import React from 'react';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import './ConfigField.css';

/**
 * ConfigField Molecule (Feature Component).
 * Renders a labeled input or select field used across system preferences.
 * Supports more robust validation and styling via Atoms.
 */
const EMPTY_OPTIONS = [];

const ConfigField = ({
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
    options = EMPTY_OPTIONS // Only used if type="select"
}) => {
    const isSelect = type === 'select';
    const rootClass = `config-field ${variant ? `config-field--${variant}` : ''}`;
    const inputClassName = `config-field__input ${className}`.trim();

    return (
        <div className={rootClass}>
            <label className="config-field__label" htmlFor={id}>
                {label}
            </label>
            
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
                />
            )}

            {hint && (
                <span className="config-field__hint">{hint}</span>
            )}
        </div>
    );
};

export default ConfigField;

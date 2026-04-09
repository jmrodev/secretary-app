import React from 'react';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';

/**
 * ConfigField Molecule (Feature Component).
 * Renders a labeled input or select field used across system preferences.
 * Supports more robust validation and styling via Atoms.
 */
const ConfigField = ({
    label,
    hint,
    type = 'text',
    value,
    onChange,
    disabled = false,
    placeholder = '',
    id,
    className = '',
    options = [] // Only used if type="select"
}) => {
    const isSelect = type === 'select';

    return (
        <div className={`config-field ${className}`}>
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
                    className="config-field__input"
                />
            ) : (
                <Input
                    type={type}
                    id={id}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="config-field__input"
                />
            )}

            {hint && (
                <span className="config-field__hint">{hint}</span>
            )}
        </div>
    );
};

export default ConfigField;


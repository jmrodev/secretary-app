import React from 'react';

/**
 * ConfigField Molecule (Feature Component).
 * Renders a labeled input or select field used across system preferences.
 * Supports standard input types and 'select' (requires options array).
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
                <select
                    id={id}
                    className="input-field"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    id={id}
                    className="input-field"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder={placeholder}
                />
            )}

            {hint && (
                <span className="config-field__hint">{hint}</span>
            )}
        </div>
    );
};

export default ConfigField;

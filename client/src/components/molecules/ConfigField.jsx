import React from 'react';
import './ConfigField.css';

/**
 * ConfigField Molecule
 * 
 * Single Responsibility: Render a labeled configuration field with optional hint
 * Composition: Label + Input + Hint
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} [props.hint] - Helper text below input
 * @param {string} [props.type] - Input type
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.id] - Input ID
 * @param {string} [props.className] - Additional CSS classes
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
    className = ''
}) => {
    return (
        <div className={`config-field ${className}`}>
            <label className="config-field__label" htmlFor={id}>
                {label}
            </label>
            <input
                type={type}
                id={id}
                className="input-field"
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
            />
            {hint && (
                <span className="config-field__hint">{hint}</span>
            )}
        </div>
    );
};

export default ConfigField;

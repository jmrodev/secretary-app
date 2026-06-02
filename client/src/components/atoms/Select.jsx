import React from 'react';
import './Select.css';

const EMPTY_ARRAY = [];

const Select = ({
    value,
    onChange,
    options = EMPTY_ARRAY,
    placeholder,
    className = '',
    disabled = false,
    id,
    name,
    required = false,
    variant = 'default', // 'default', 'error'
    size = 'md' // 'sm', 'md', 'lg'
}) => {
    const baseClass = 'select';

    const variantClass = variant !== 'default' ? `${baseClass}--${variant}` : '';
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';

    const combinedClassName = `
        ${baseClass} 
        ${variantClass} 
        ${sizeClass} 
        ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className={combinedClassName}
            disabled={disabled}
            required={required}
        >
            {placeholder && (
                <option value="" disabled={required}>
                    {placeholder}
                </option>
            )}
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};

export default Select;

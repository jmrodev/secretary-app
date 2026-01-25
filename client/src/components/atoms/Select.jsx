import React from 'react';

const Select = ({
    value,
    onChange,
    options = [],
    className = '',
    disabled = false,
    id,
    name,
    required = false
}) => {
    return (
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className={`input-field ${className}`}
            disabled={disabled}
            required={required}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};

export default Select;

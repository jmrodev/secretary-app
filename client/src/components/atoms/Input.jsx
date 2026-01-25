import React from 'react';

const Input = ({
    type = 'text',
    value,
    onChange,
    placeholder = '',
    className = '',
    disabled = false,
    id,
    name,
    required = false,
    rows = 3
}) => {
    const baseClass = 'input-field';

    if (type === 'textarea') {
        return (
            <textarea
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`${baseClass} ${className}`}
                disabled={disabled}
                required={required}
                rows={rows}
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
            className={`${baseClass} ${className}`}
            disabled={disabled}
            required={required}
        />
    );
};

export default Input;

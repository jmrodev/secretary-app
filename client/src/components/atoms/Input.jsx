import React from 'react';
import './Input.css';

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
    rows = 3,
    variant = 'default', // 'default' | 'error' | 'success'
    size = 'md' // 'sm' | 'md' | 'lg'
}) => {
    const baseClass = 'input';

    const variantClass = variant !== 'default' ? `${baseClass}--${variant}` : '';
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';
    const typeClass = type === 'textarea' ? `${baseClass}--textarea` : '';

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
        />
    );
};

export default Input;

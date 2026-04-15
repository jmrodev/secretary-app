import React, { useState, useEffect } from 'react';
import './CurrencyInput.css';

/**
 * CurrencyInput Atom follows Atomic Design & BEM.
 * Reuses the 'input' base class from design-system.
 */
const CurrencyInput = ({
    value,
    onChange,
    placeholder,
    className = '',
    required,
    size = 'md',
    variant = 'default',
    ...props
}) => {
    const [displayValue, setDisplayValue] = useState('');

    const baseClass = 'input';
    const variantClass = variant !== 'default' ? `${baseClass}--${variant}` : '';
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';

    const combinedClassName = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

    useEffect(() => {
        if (value !== undefined && value !== null) {
            setDisplayValue(format(value));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const format = (val) => {
        if (!val && val !== 0) return '';
        return new Intl.NumberFormat('es-AR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    const handleChange = (e) => {
        const inputVal = e.target.value;
        const rawValue = inputVal.replace(/\D/g, '');

        if (rawValue === '') {
            setDisplayValue('');
            onChange({ target: { value: '' } });
            return;
        }

        const numValue = Number(rawValue);
        setDisplayValue(format(numValue));
        onChange({ target: { value: numValue } });
    };

    return (
        <input
            {...props}
            type="text"
            className={combinedClassName}
            placeholder={placeholder}
            required={required}
            value={displayValue}
            onChange={handleChange}
        />
    );
};

export default CurrencyInput;

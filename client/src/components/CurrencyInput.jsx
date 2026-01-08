import { useState, useEffect } from 'react';

const CurrencyInput = ({ value, onChange, placeholder, className, required, ...props }) => {
    // Local state for display value
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Update display value when prop value changes externally
        if (value !== undefined && value !== null) {
            setDisplayValue(format(value));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const format = (val) => {
        if (!val && val !== 0) return '';
        // Convert to number and format with dots
        // Note: Using es-AR locale for 10.000 style
        return new Intl.NumberFormat('es-AR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    const handleChange = (e) => {
        const inputVal = e.target.value;

        // Remove non-numeric chars (except potentially a comma if we supported decimals, 
        // but user requested simple "mil" differentiation, so integers are safer for now unless specified).
        // Let's assume integers for "prices" as requested context usually implies.
        const rawValue = inputVal.replace(/\D/g, ''); // Remove all non-digits

        if (rawValue === '') {
            setDisplayValue('');
            onChange({ target: { value: '' } }); // Mimic event object
            return;
        }

        const numValue = Number(rawValue);
        setDisplayValue(format(numValue));

        // Propagate changes to parent as standard event or value
        // To be compatible with existing code expecting e.target.value
        onChange({ target: { value: numValue } });
    };

    return (
        <input
            {...props}
            type="text"
            className={className}
            placeholder={placeholder}
            required={required}
            value={displayValue}
            onChange={handleChange}
        />
    );
};

export default CurrencyInput;

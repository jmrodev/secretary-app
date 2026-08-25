import React, { useState } from 'react';
import { Input } from '@/components/atoms/Input';

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

const format = (val) => {
    const num = Number(val);
    if (Number.isNaN(num) || (!num && num !== 0)) return '';
    return CURRENCY_FORMATTER.format(num);
};

/**
 * CurrencyInput Atom follows Atomic Design & BEM.
 * Renders the shared Input atom (type="text") so it inherits Input.module.css
 * styling while keeping the es-AR number formatting and the
 * onChange({ target: { value: numValue } }) contract intact.
 */
export const CurrencyInput = ({
    value,
    onChange,
    placeholder,
    className = '',
    required,
    size = 'md',
    variant = 'default',
    ...props
}) => {
    const [prevValue, setPrevValue] = useState(value);
    const [displayValue, setDisplayValue] = useState(() => {
        if (value !== undefined && value !== null) return format(value);
        return '';
    });

    if (!Object.is(value, prevValue)) {
        setPrevValue(value);
        if (value !== undefined && value !== null) {
            setDisplayValue(format(value));
        } else {
            setDisplayValue('');
        }
    }

    const handleCurrencyChange = (e) => {
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
        <Input
            {...props}
            type="text"
            size={size}
            variant={variant}
            className={className}
            placeholder={placeholder}
            required={required}
            value={displayValue}
            onChange={handleCurrencyChange}
        />
    );
};

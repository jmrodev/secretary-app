import React, { useMemo } from 'react';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import styles from './PhoneInput.module.css';

const COUNTRY_OPTIONS = [
    { value: '+54', label: '🇦🇷 +54' },
    { value: '+598', label: '🇺🇾 +598' },
    { value: '+56', label: '🇨🇱 +56' },
    { value: '+55', label: '🇧🇷 +55' },
    { value: '+595', label: '🇵🇾 +595' },
    { value: '+591', label: '🇧🇴 +591' },
    { value: '+51', label: '🇵🇪 +51' },
    { value: '+57', label: '🇨🇴 +57' },
    { value: '+52', label: '🇲🇽 +52' },
    { value: '+1', label: '🇺🇸 +1' },
    { value: '+34', label: '🇪🇸 +34' },
    { value: '', label: '🌐' }
];

export const PhoneInput = ({ value, onChange, placeholder = 'Número...', disabled = false, required = false, className = '', onBlur }) => {
    // Determine country code and number
    const { code, number } = useMemo(() => {
        const val = value || '';
        const match = COUNTRY_OPTIONS.find(opt => opt.value && val.startsWith(opt.value));
        if (match) {
            return { code: match.value, number: val.slice(match.value.length) };
        }
        return { code: '+54', number: val.startsWith('54') ? val.slice(2) : val }; // Default to +54
    }, [value]);

    const handleCodeChange = (e) => {
        const newCode = e.target.value;
        onChange(newCode + number);
    };

    const handleNumberChange = (e) => {
        const newNum = e.target.value;
        onChange(code + newNum);
    };

    return (
        <div className={`${styles.root} ${className}`}>
            <Select
                value={code}
                onChange={handleCodeChange}
                options={COUNTRY_OPTIONS}
                disabled={disabled}
                className={styles.select}
            />
            <Input
                value={number}
                onChange={handleNumberChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={styles.input}
                onBlur={onBlur}
            />
        </div>
    );
};


import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Select } from '@/components/atoms/Select';
import { PhoneInput } from '@/components/molecules/PhoneInput';
import styles from './PhoneNumbersManager.module.css';

/**
 * PhoneNumbersManager Shared Molecule (BEM).
 * Optimized for high-density Bento Box layouts.
 * Shared across: institutions, patients, users, auth and config features.
 * 
 * @param {Array} phoneNumbers - List of phone numbers
 * @param {Function} onChange - Callback when list changes
 * @param {Object} texts - Translations { cellPhone, label, call, markAsPrimary, deleteBtn, addAnotherPhone }
 */
const EMPTY_OBJECT = {};

export const PhoneNumbersManager = ({ phoneNumbers, onChange, texts = EMPTY_OBJECT }) => {
    const generateId = () => crypto.randomUUID();

    // Default fallbacks in case texts are not provided
    const tx = {
        cellPhone: texts.cellPhone || 'Celular',
        label: texts.label || 'Etiqueta',
        call: texts.call || 'Llamar',
        markAsPrimary: texts.markAsPrimary || 'Marcar como principal',
        deleteBtn: texts.deleteBtn || 'Eliminar',
        addAnotherPhone: texts.addAnotherPhone || 'Agregar otro teléfono'
    };

    // Ghost item if list is empty
    const displayPhoneNumbers = (phoneNumbers && phoneNumbers.length > 0)
        ? phoneNumbers
        : [{ id: 'ghost', phone_number: '+549', label: tx.cellPhone, is_primary: true }];

    const handleAdd = () => {
        onChange([...(phoneNumbers || []), { id: generateId(), phone_number: '+549', label: tx.cellPhone, is_primary: false }]);
    };

    const handleRemove = (index) => {
        if (!phoneNumbers || phoneNumbers.length === 0) return;
        onChange(phoneNumbers.filter((_, i) => i !== index));
    };

    const handleUpdate = (index, field, value) => {
        let currentList = (phoneNumbers && phoneNumbers.length > 0) 
            ? phoneNumbers.map(p => ({ ...p, id: p.id || generateId() })) 
            : [{ id: generateId(), phone_number: '54', label: tx.cellPhone, is_primary: true }];
            
        let sanitizedValue = value;
        if (field === 'phone_number') {
            sanitizedValue = value.replace(/[^\d+]/g, '');
        }

        currentList[index] = { ...currentList[index], [field]: sanitizedValue };
        
        if (field === 'is_primary' && value === true) {
            currentList.forEach((p, i) => { if (i !== index) p.is_primary = false; });
        }
        onChange(currentList);
    };

    const labelOptions = [
        { value: 'Celular', label: 'Celular' },
        { value: 'Fijo', label: 'Fijo' },
        { value: 'Laboral', label: 'Laboral' },
        { value: 'Familiar', label: 'Familiar' },
        { value: 'Otro', label: 'Otro' }
    ];

    return (
        <div className={`${styles.root}`}>
            {displayPhoneNumbers.map((pn, index) => (
                <div key={pn.id || `phone-${index}`} className={`${styles.row} ${pn.is_primary ? styles.rowPrimary : ''}`}>
                    <div className={`${styles.labelWrapper}`}>
                        <Select
                            value={pn.label}
                            onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                            options={labelOptions}
                        />
                    </div>

                    <div className={`${styles.numberWrapper}`}>
                        <PhoneInput
                            value={pn.phone_number}
                            onChange={(newValue) => handleUpdate(index, 'phone_number', newValue)}
                            required
                        />
                    </div>

                    <div className={`${styles.controls}`}>
                        <button
                            type="button"
                            className={`${styles.star} ${pn.is_primary ? styles.starActive : ''}`}
                            onClick={() => handleUpdate(index, 'is_primary', true)}
                            title={tx.markAsPrimary}
                        >
                            <Icon name={pn.is_primary ? 'star' : 'star_outline'} size="1rem" />
                        </button>

                        <button
                            type="button"
                            className={`${styles.delete}`}
                            onClick={() => handleRemove(index)}
                            title={tx.deleteBtn}
                        >
                            <Icon name="close" size="1rem" />
                        </button>
                    </div>
                </div>
            ))}

            <button type="button" className={`${styles.add}`} onClick={handleAdd}>
                <Icon name="add" size="0.9rem" />
                <span>{tx.addAnotherPhone}</span>
            </button>
        </div>
    );
};


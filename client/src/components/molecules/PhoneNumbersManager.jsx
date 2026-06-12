import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
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

const PhoneNumbersManager = ({ phoneNumbers, onChange, texts = EMPTY_OBJECT }) => {
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
            : [{ id: generateId(), phone_number: '+549', label: tx.cellPhone, is_primary: true }];
            
        currentList[index] = { ...currentList[index], [field]: value };
        
        if (field === 'is_primary' && value === true) {
            currentList.forEach((p, i) => { if (i !== index) p.is_primary = false; });
        }
        onChange(currentList);
    };

    return (
        <section className={`${styles.root}`}>
            <div className={`${styles.list}`}>
                {displayPhoneNumbers.map((pn, index) => (
                    <div key={pn.id || `phone-${index}`} className={`${styles.row} ${pn.is_primary ? styles.rowPrimary : ''}`}>
                        <div className={`${styles.labelWrapper}`}>
                            <input
                                className={`${styles.inputLabel}`}
                                value={pn.label}
                                onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                                placeholder={tx.label}
                            />
                        </div>

                        <div className={`${styles.numberWrapper}`}>
                            <input
                                className={`${styles.inputNumber}`}
                                value={pn.phone_number}
                                onChange={(e) => handleUpdate(index, 'phone_number', e.target.value)}
                                placeholder="+549..."
                                required
                            />
                            
                            {pn.phone_number && pn.phone_number.length > 5 && (
                                <div className={`${styles.actions}`}>
                                    <Button
                                        to={`tel:${pn.phone_number.replace(/[^0-9+]/g, '')}`}
                                        variant="link"
                                        size="compact"
                                        title={tx.call}
                                        className={`${styles.action} ${styles.actionCall}`}
                                        icon={<Icon name="call" size="1rem" />}
                                    />
                                    <Button
                                        to={`https://wa.me/${pn.phone_number.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        variant="link"
                                        size="compact"
                                        title="WhatsApp"
                                        className={`${styles.action} ${styles.actionWhatsapp}`}
                                        icon={<Icon name="chat" size="1rem" />}
                                    />
                                </div>
                            )}
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
            </div>

            <button type="button" className={`${styles.add}`} onClick={handleAdd}>
                <Icon name="add" size="0.9rem" />
                <span>{tx.addAnotherPhone}</span>
            </button>
        </section>
    );
};

export default PhoneNumbersManager;

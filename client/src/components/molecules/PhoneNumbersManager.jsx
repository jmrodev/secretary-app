import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './PhoneNumbersManager.css';

/**
 * PhoneNumbersManager Shared Molecule (BEM).
 * Optimized for high-density Bento Box layouts.
 * Shared across: institutions, patients, users, auth and config features.
 */
const PhoneNumbersManager = ({ phoneNumbers, onChange }) => {
    const { t } = useLanguage();

    // Ghost item if list is empty
    const displayPhoneNumbers = (phoneNumbers && phoneNumbers.length > 0)
        ? phoneNumbers
        : [{ phone_number: '+549', label: t('cell_phone') || 'Celular', is_primary: true }];

    const handleAdd = () => {
        onChange([...(phoneNumbers || []), { phone_number: '+549', label: t('cell_phone') || 'Celular', is_primary: false }]);
    };

    const handleRemove = (index) => {
        if (!phoneNumbers || phoneNumbers.length === 0) return;
        onChange(phoneNumbers.filter((_, i) => i !== index));
    };

    const handleUpdate = (index, field, value) => {
        let currentList = (phoneNumbers && phoneNumbers.length > 0) ? [...phoneNumbers] : [{ phone_number: '+549', label: t('cell_phone') || 'Celular', is_primary: true }];
        currentList[index][field] = value;
        if (field === 'is_primary' && value === true) {
            currentList.forEach((p, i) => { if (i !== index) p.is_primary = false; });
        }
        onChange(currentList);
    };

    return (
        <section className="phone-numbers-manager">
            <div className="phone-numbers-manager__list">
                {displayPhoneNumbers.map((pn, index) => (
                    <div key={`phone-${index}`} className={`phone-numbers-manager__row ${pn.is_primary ? 'phone-numbers-manager__row--primary' : ''}`}>
                        <div className="phone-numbers-manager__label-wrapper">
                            <input
                                className="phone-numbers-manager__input-label"
                                value={pn.label}
                                onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                                placeholder={t('label')}
                            />
                        </div>

                        <div className="phone-numbers-manager__number-wrapper">
                            <input
                                className="phone-numbers-manager__input-number"
                                value={pn.phone_number}
                                onChange={(e) => handleUpdate(index, 'phone_number', e.target.value)}
                                placeholder="+549..."
                                required
                            />
                            
                            {pn.phone_number && pn.phone_number.length > 5 && (
                                <div className="phone-numbers-manager__actions">
                                    <Button
                                        to={`tel:${pn.phone_number.replace(/[^0-9+]/g, '')}`}
                                        variant="link"
                                        size="compact"
                                        title={t('call')}
                                        className="phone-numbers-manager__action phone-numbers-manager__action--call"
                                        icon={<Icon name="call" size="1rem" />}
                                    />
                                    <Button
                                        to={`https://wa.me/${pn.phone_number.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        variant="link"
                                        size="compact"
                                        title="WhatsApp"
                                        className="phone-numbers-manager__action phone-numbers-manager__action--whatsapp"
                                        icon={<Icon name="chat" size="1rem" />}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="phone-numbers-manager__controls">
                            <button
                                type="button"
                                className={`phone-numbers-manager__star ${pn.is_primary ? 'phone-numbers-manager__star--active' : ''}`}
                                onClick={() => handleUpdate(index, 'is_primary', true)}
                                title={t('mark_as_primary')}
                            >
                                <Icon name={pn.is_primary ? 'star' : 'star_outline'} size="1rem" />
                            </button>

                            <button
                                type="button"
                                className="phone-numbers-manager__delete"
                                onClick={() => handleRemove(index)}
                                title={t('delete')}
                            >
                                <Icon name="close" size="1rem" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button type="button" className="phone-numbers-manager__add" onClick={handleAdd}>
                <Icon name="add" size="0.9rem" />
                <span>{t('add_another_phone')}</span>
            </button>
        </section>
    );
};

export default PhoneNumbersManager;

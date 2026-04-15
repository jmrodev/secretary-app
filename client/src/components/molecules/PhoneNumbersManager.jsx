import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './PhoneNumbersManager.css';

/**
 * PhoneNumbersManager Shared Molecule (BEM).
 * Global orchestrator for institutional or personal contact numbers.
 * Supports primary number isolation, phone normalization, and quick communication actions (Call/WhatsApp).
 * Shared across: institutions, patients, users, auth and config features.
 */
const PhoneNumbersManager = ({ phoneNumbers, onChange }) => {
    const { t } = useLanguage();

    // Ensure we always have at least one item to render (Ghost item if list is empty)
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
        <div className="phone-manager--container">
            <label className="phone-manager__header-label">
                <Icon name="smartphone" size="1.2rem" color="var(--accent-color)" />
                {t('phone_numbers') || 'Números de Contacto'}
            </label>
            {displayPhoneNumbers.map((pn, index) => (
                <div key={index} className="phone-manager__item-card">
                    <input
                        className="phone-manager__input-label"
                        value={pn.label}
                        onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                        placeholder={t('label')}
                    />
                    <div className="phone-manager__input-number-wrapper">
                        <input
                            className="phone-manager__input-number"
                            value={pn.phone_number}
                            onChange={(e) => handleUpdate(index, 'phone_number', e.target.value)}
                            placeholder="+549..."
                            required
                        />
                        {pn.phone_number && pn.phone_number.length > 5 && (
                            <div className="phone-manager__actions-group">
                                <Button
                                    to={`tel:${pn.phone_number.replace(/[^0-9+]/g, '')}`}
                                    variant="link"
                                    size="sm-compact"
                                    title="Llamar"
                                    className="phone-manager__action-link phone-manager__action-link--call"
                                    icon={<Icon name="call" size="1.1rem" />}
                                />
                                <Button
                                    to={`https://wa.me/${pn.phone_number.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    variant="link"
                                    size="sm-compact"
                                    title="WhatsApp"
                                    className="phone-manager__action-link phone-manager__action-link--whatsapp"
                                    icon={<Icon name="chat" size="1.1rem" />}
                                />
                            </div>
                        )}
                    </div>
                    <div className="phone-manager__primary-selector">
                        <label className="phone-manager__primary-option">
                            <input
                                type="radio"
                                className="phone-manager__radio-input"
                                name={`primary-phone-${index}`}
                                checked={pn.is_primary}
                                onChange={() => handleUpdate(index, 'is_primary', true)}
                            />
                            <span className="phone-manager__primary-text">{t('primary') || 'Principal'}</span>
                        </label>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        className="phone-manager__delete-button"
                        onClick={() => handleRemove(index)}
                        title={t('delete')}
                        icon={<Icon name="delete" size="1.1rem" />}
                    />
                </div>
            ))}
            <div className="phone-manager__footer">
                <Button
                    variant="secondary"
                    size="sm"
                    className="phone-manager__add-button"
                    onClick={handleAdd}
                    icon={<Icon name="add" size="1rem" />}
                >
                    {t('add_phone') || 'Agregar Contacto'}
                </Button>
            </div>
        </div>
    );
};

export default PhoneNumbersManager;

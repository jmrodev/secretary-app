import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import './PhoneNumbersManager.css';

const PhoneNumbersManager = ({ phoneNumbers, onChange }) => {
    const { t } = useLanguage();

    // Ensure we always have at least one item to render (Ghost item if list is empty)
    const displayPhoneNumbers = (phoneNumbers && phoneNumbers.length > 0)
        ? phoneNumbers
        : [{ phone_number: '+549', label: 'Celular', is_primary: true }];

    const handleAdd = () => {
        onChange([...(phoneNumbers || []), { phone_number: '+549', label: 'Celular', is_primary: false }]);
    };

    const handleRemove = (index) => {
        if (!phoneNumbers || phoneNumbers.length === 0) return;
        onChange(phoneNumbers.filter((_, i) => i !== index));
    };

    const handleUpdate = (index, field, value) => {
        let currentList = (phoneNumbers && phoneNumbers.length > 0) ? [...phoneNumbers] : [{ phone_number: '+549', label: 'Celular', is_primary: true }];

        currentList[index][field] = value;

        if (field === 'is_primary' && value === true) {
            currentList.forEach((p, i) => { if (i !== index) p.is_primary = false; });
        }
        onChange(currentList);
    };

    return (
        <div className="phone-manager">
            <label className="phone-manager__label">
                <Icon name="smartphone" size="1.2rem" />
                {t('phone_numbers')}
            </label>
            {displayPhoneNumbers.map((pn, index) => (
                <div key={index} className="phone-manager__item">
                    <input
                        className="phone-manager__input phone-manager__input--label"
                        value={pn.label}
                        onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                        placeholder={t('label')}
                    />
                    <div className="phone-manager__number-box">
                        <input
                            className="phone-manager__input phone-manager__input--number"
                            value={pn.phone_number}
                            onChange={(e) => handleUpdate(index, 'phone_number', e.target.value)}
                            placeholder="+549..."
                            required
                        />
                        {pn.phone_number && pn.phone_number.length > 5 && (
                            <div className="phone-manager__quick-actions">
                                <Button
                                    to={`tel:${pn.phone_number.replace(/[^0-9+]/g, '')}`}
                                    variant="link"
                                    size="sm"
                                    title="Llamar"
                                    icon={<Icon name="call" size="1.1rem" />}
                                />
                                <Button
                                    to={`https://wa.me/${pn.phone_number.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    variant="link"
                                    size="sm"
                                    title="WhatsApp"
                                    icon={<Icon name="chat" size="1.1rem" />}
                                />
                            </div>
                        )}
                    </div>
                    <div className="phone-manager__primary-selector">
                        <label className="phone-manager__primary-label">
                            <input
                                type="radio"
                                className="phone-manager__radio"
                                name={`primary-phone-${index}`}
                                checked={pn.is_primary}
                                onChange={() => handleUpdate(index, 'is_primary', true)}
                            />
                            {t('primary')}
                        </label>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="phone-manager__delete-btn"
                        onClick={() => handleRemove(index)}
                        title={t('delete')}
                        icon={<Icon name="delete" size="1.1rem" />}
                    />
                </div>
            ))}
            <Button
                variant="secondary"
                size="sm"
                className="phone-manager__add-btn"
                onClick={handleAdd}
                icon={<Icon name="add" />}
            >
                {t('add_phone')}
            </Button>
        </div>
    );
};

export default PhoneNumbersManager;

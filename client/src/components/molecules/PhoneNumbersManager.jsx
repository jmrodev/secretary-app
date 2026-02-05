import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './PhoneNumbersManager.css';

const PhoneNumbersManager = ({ phoneNumbers, onChange }) => {
    const { t } = useLanguage();

    const handleAdd = () => {
        onChange([...(phoneNumbers || []), { phone_number: '+549', label: 'Celular', is_primary: (phoneNumbers || []).length === 0 }]);
    };

    const handleRemove = (index) => {
        onChange(phoneNumbers.filter((_, i) => i !== index));
    };

    const handleUpdate = (index, field, value) => {
        const next = [...phoneNumbers];
        next[index][field] = value;
        if (field === 'is_primary' && value === true) {
            next.forEach((p, i) => { if (i !== index) p.is_primary = false; });
        }
        onChange(next);
    };

    return (
        <div className="phone-manager">
            <label className="phone-manager__label">
                📱 {t('phone_numbers')}
            </label>
            {(phoneNumbers || []).map((pn, index) => (
                <div key={index} className="phone-manager__item">
                    <input
                        className="form-input phone-manager__label-input"
                        value={pn.label}
                        onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                        placeholder={t('label')}
                    />
                    <div className="phone-manager__number-box">
                        <input
                            className="form-input phone-manager__number-input"
                            value={pn.phone_number}
                            onChange={(e) => handleUpdate(index, 'phone_number', e.target.value)}
                            placeholder="+549..."
                            required
                        />
                        {pn.phone_number && pn.phone_number.length > 5 && (
                            <div className="phone-manager__quick-actions">
                                <a
                                    href={`tel:${pn.phone_number.replace(/[^0-9+]/g, '')}`}
                                    title="Llamar"
                                    className="phone-manager__action-link"
                                >
                                    📞
                                </a>
                                <a
                                    href={`https://wa.me/${pn.phone_number.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="WhatsApp"
                                    className="phone-manager__action-link"
                                >
                                    📱
                                </a>
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
                    <button
                        type="button"
                        className="phone-manager__delete-btn"
                        onClick={() => handleRemove(index)}
                        title={t('delete')}
                    >
                        🗑️
                    </button>
                </div>
            ))}
            <button
                type="button"
                className="btn btn-secondary btn-sm phone-manager__add-btn"
                onClick={handleAdd}
            >
                ➕ {t('add_phone')}
            </button>
        </div>
    );
};

export default PhoneNumbersManager;

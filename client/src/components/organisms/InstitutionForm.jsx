import React from 'react';
import Button from '../atoms/Button';
import PhoneNumbersManager from '../molecules/PhoneNumbersManager';
import { useLanguage } from '../../context/LanguageContext';

const InstitutionForm = ({ formData, onChange, onSubmit, onCancel, isEditing, isSubmitting = false }) => {
    const { t } = useLanguage();

    return (
        <form onSubmit={onSubmit} className="institution-form flex flex-col gap-4">
            <div className="form-group-bem">
                <label className="input-label">{t('institution_name')} *</label>
                <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={e => onChange('name', e.target.value)}
                    required
                />
            </div>

            <div className="form-group-bem">
                <label className="input-label">{t('base_amount_label')}</label>
                <input
                    type="number"
                    className="input-field"
                    value={formData.base_price}
                    onChange={e => onChange('base_price', e.target.value)}
                    placeholder="0.00"
                />
            </div>

            <div className="mb-4">
                <PhoneNumbersManager
                    phoneNumbers={formData.phoneNumbers}
                    onChange={(newContext) => onChange('phoneNumbers', newContext)}
                />
            </div>

            <div className="form-group-bem">
                <label className="input-label">{t('description')}</label>
                <textarea
                    className="input-field"
                    rows="3"
                    value={formData.description}
                    onChange={e => onChange('description', e.target.value)}
                />
            </div>

            <div className="form-group-bem">
                <label className="input-label">{t('status')}</label>
                <select
                    className="input-field"
                    value={formData.status}
                    onChange={e => onChange('status', e.target.value)}
                >
                    <option value="active">{t('active')}</option>
                    <option value="inactive">{t('inactive')}</option>
                </select>
            </div>

            <div className="modal-footer modal-footer--right mt-4">
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel} type="button">
                        {t('cancel')}
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {t('save')}
                </Button>
            </div>
        </form>
    );
};

export default InstitutionForm;

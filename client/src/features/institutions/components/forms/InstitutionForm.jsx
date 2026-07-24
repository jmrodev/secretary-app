import React from 'react';
import { Button } from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import PhoneNumbersManager from '@/components/molecules/PhoneNumbersManager';
import { useLanguage } from '@/hooks/useLanguage';
import { capitalizeWords } from '@/utils/core/stringUtils';
import styles from './InstitutionForm.module.css';

const InstitutionForm = ({ formData, onChange, onSubmit, onCancel, isSubmitting = false }) => {
    const { t } = useLanguage();

    const statusOptions = [
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') }
    ];

    return (
        <form onSubmit={onSubmit} className={`${styles.root}`}>
            <div className={`${styles.group}`}>
                <label className={`${styles.label}`}>{t('institution_name')} *</label>
                <Input
                    type="text"
                    className="institution-form__input"
                    value={formData.name}
                    onChange={e => onChange('name', capitalizeWords(e.target.value))}
                    required
                />
            </div>

            <div className={`${styles.group}`}>
                <label className={`${styles.label}`}>{t('base_amount_label')}</label>
                <Input
                    type="number"
                    className="institution-form__input"
                    value={formData.base_price}
                    onChange={e => onChange('base_price', e.target.value)}
                    placeholder="0.00"
                />
            </div>

            <div className="institution-form__phone-manager">
                <PhoneNumbersManager
                    phoneNumbers={formData.phoneNumbers}
                    onChange={(newContext) => onChange('phoneNumbers', newContext)}
                />
            </div>

            <div className={`${styles.group}`}>
                <label className={`${styles.label}`}>{t('description')}</label>
                <Input
                    type="textarea"
                    rows={3}
                    className="institution-form__input"
                    value={formData.description}
                    onChange={e => onChange('description', e.target.value)}
                />
            </div>

            <div className={`${styles.group}`}>
                <label className={`${styles.label}`}>{t('status')}</label>
                <Select
                    className="institution-form__input"
                    value={formData.status}
                    options={statusOptions}
                    onChange={e => onChange('status', e.target.value)}
                />
            </div>

            <div className={`${styles.footer}`}>
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


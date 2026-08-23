import React from 'react';
import { FormGroup } from '@/components/molecules/FormGroup';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { PhoneNumbersManager } from '@/components/molecules/PhoneNumbersManager';
import { useLanguage } from '@/hooks/useLanguage';
import { capitalizeWords } from '@/utils/core/stringUtils';
import sharedStyles from '@/styles/shared.module.css';
import styles from './UserForm.module.css';

export const UserForm = ({ type, formData, setFormData }) => {
    const { t } = useLanguage();

    const handleUserUpdate = (field, value) => {
        if (['first_name', 'last_name', 'full_name', 'specialty'].includes(field) && typeof value === 'string') {
            value = capitalizeWords(value);
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (type === 'DELETE') {
        return (
            <div className={`${styles.UserForm__root} ${sharedStyles.AnimateFadeIn}`}>
                <p className={`${styles.UserForm__hint}`}>
                    {t('delete_confirmation')} <strong>{formData.username}</strong>?
                    <br />
                    <span className={`${styles.UserForm__hintDanger}`}>{t('action_cannot_undone')}</span>
                </p>
            </div>
        );
    }

    if (type === 'RESET_DNI') {
        return (
            <div className={`${styles.UserForm__alert} ${sharedStyles.AnimateFadeIn}`}>
                <p className={`${styles.UserForm__alertText}`}>
                    {t('reset_password_to_dni_confirm')} <strong>{formData.username}</strong> {t('to_dni')} (<strong>{formData.dni}</strong>)?
                </p>
            </div>
        );
    }

    if (type === 'RESET_MANUAL') {
        return (
            <div className={`${styles.UserForm__root} ${sharedStyles.AnimateFadeIn}`}>
                <FormGroup label={t('new_password')}>
                    <Input
                        value={formData.password}
                        onChange={e => handleUserUpdate('password', e.target.value)}
                        placeholder={t('new_password_placeholder')}
                    />
                </FormGroup>
            </div>
        );
    }

    return (
        <div className={`${styles.UserForm__root} ${sharedStyles.AnimateFadeIn}`}>
            <div className={`${styles.UserForm__row}`}>
                <FormGroup label={t('username')} required>
                    <Input
                        value={formData.username}
                        onChange={e => handleUserUpdate('username', e.target.value)}
                    />
                </FormGroup>
                {type === 'CREATE' && (
                    <FormGroup label={t('password')} required>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={e => handleUserUpdate('password', e.target.value)}
                        />
                    </FormGroup>
                )}
            </div>

            <FormGroup label={t('role_header')}>
                <Select
                    value={formData.role}
                    onChange={e => handleUserUpdate('role', e.target.value)}
                    options={[
                        { value: 'doctor', label: t('doctor') },
                        { value: 'secretary', label: t('secretary') },
                        { value: 'admin', label: t('admin') }
                    ]}
                />
            </FormGroup>

            <div className={`${styles.UserForm__row}`}>
                <FormGroup label={t('first_name')} required>
                    <Input
                        value={formData.first_name || ''}
                        onChange={e => handleUserUpdate('first_name', e.target.value)}
                    />
                </FormGroup>
                <FormGroup label={t('last_name')} required>
                    <Input
                        value={formData.last_name || ''}
                        onChange={e => handleUserUpdate('last_name', e.target.value)}
                    />
                </FormGroup>
            </div>

            <div className={`${styles.UserForm__row}`}>
                <FormGroup label={t('email')}>
                    <Input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => handleUserUpdate('email', e.target.value)}
                    />
                </FormGroup>
                <FormGroup label={t('address')}>
                    <Input
                        value={formData.address || ''}
                        onChange={e => handleUserUpdate('address', e.target.value)}
                    />
                </FormGroup>
            </div>

            <FormGroup label={t('dni')}>
                <Input
                    value={formData.dni}
                    onChange={e => handleUserUpdate('dni', e.target.value)}
                />
            </FormGroup>

            <div className={`${styles.UserForm__divider}`}>
                <PhoneNumbersManager
                    phoneNumbers={formData.phoneNumbers}
                    onChange={(newPhones) => handleUserUpdate('phoneNumbers', newPhones)}
                />
            </div>

            {formData.role === 'doctor' && (
                <FormGroup label={t('specialty')}>
                    <Input
                        value={formData.specialty}
                        onChange={e => handleUserUpdate('specialty', e.target.value)}
                        placeholder={t('specialty_placeholder')}
                    />
                </FormGroup>
            )}
        </div>
    );
};

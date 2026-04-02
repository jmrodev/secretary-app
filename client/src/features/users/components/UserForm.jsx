import React, { useState } from 'react';
import FormGroup from '../../../components/molecules/FormGroup';
import Input from '../../../components/atoms/Input';
import Select from '../../../components/atoms/Select';
import Button from '../../../components/atoms/Button';
import PhoneNumbersManager from '../../../components/molecules/PhoneNumbersManager';
import { useLanguage } from '../../../context/LanguageContext';
import api from '../../../api/axios';
import { capitalizeWords } from '../../../utils/stringUtils';
import './UserForm.css';

const UserForm = ({ type, formData, setFormData }) => {
    const { t } = useLanguage();

    const handleChange = (field, value) => {
        if (['full_name', 'specialty'].includes(field) && typeof value === 'string') {
            value = capitalizeWords(value);
        }
        setFormData({ ...formData, [field]: value });
    };

    if (type === 'DELETE') {
        return (
            <div className="user-form animate-fadeIn">
                <p className="user-form__hint">
                    {t('delete_confirmation') || '¿Eliminar usuario?'} <strong>{formData.username}</strong>?
                    <br />
                    <span className="user-form__hint--danger">{t('action_cannot_undone')}</span>
                </p>
                <FormGroup label="Código de Seguridad (1234)">
                    <Input
                        type="password"
                        placeholder="Ingrese 1234 para confirmar"
                        value={formData.securityCode || ''}
                        onChange={e => handleChange('securityCode', e.target.value)}
                    />
                </FormGroup>
            </div>
        );
    }

    if (type === 'RESET_DNI') {
        return (
            <div className="user-form__alert animate-fadeIn">
                <p className="user-form__alert-text">
                    ¿Reiniciar contraseña de <strong>{formData.username}</strong> al DNI (<strong>{formData.dni}</strong>)?
                </p>
            </div>
        );
    }

    if (type === 'RESET_MANUAL') {
        return (
            <div className="user-form animate-fadeIn">
                <FormGroup label={t('new_password')}>
                    <Input
                        value={formData.password}
                        onChange={e => handleChange('password', e.target.value)}
                        placeholder="Nueva contraseña"
                    />
                </FormGroup>
            </div>
        );
    }

    return (
        <div className="user-form animate-fadeIn">
            <div className="user-form__row">
                <FormGroup label={t('username')} required>
                    <Input
                        value={formData.username}
                        onChange={e => handleChange('username', e.target.value)}
                    />
                </FormGroup>
                {type === 'CREATE' && (
                    <FormGroup label={t('password')} required>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={e => handleChange('password', e.target.value)}
                        />
                    </FormGroup>
                )}
            </div>

            <FormGroup label={t('role_header')}>
                <Select
                    value={formData.role}
                    onChange={e => handleChange('role', e.target.value)}
                    options={[
                        { value: 'doctor', label: t('doctor') },
                        { value: 'secretary', label: t('secretary') },
                        { value: 'admin', label: 'Administrador' }
                    ]}
                />
            </FormGroup>

            <FormGroup label={t('full_name')} required>
                <Input
                    value={formData.full_name}
                    onChange={e => handleChange('full_name', e.target.value)}
                />
            </FormGroup>

            <FormGroup label={t('dni')}>
                <Input
                    value={formData.dni}
                    onChange={e => handleChange('dni', e.target.value)}
                />
            </FormGroup>

            <div className="user-form__divider">
                <PhoneNumbersManager
                    phoneNumbers={formData.phoneNumbers}
                    onChange={(newPhones) => handleChange('phoneNumbers', newPhones)}
                />
            </div>

            {formData.role === 'doctor' && (
                <FormGroup label={t('specialty')}>
                    <Input
                        value={formData.specialty}
                        onChange={e => handleChange('specialty', e.target.value)}
                        placeholder="E.g. Cardiología"
                    />
                </FormGroup>
            )}
        </div>
    );
};

export default UserForm;

import React, { useState } from 'react';
import FormGroup from '../molecules/FormGroup';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import Button from '../atoms/Button';
import PhoneNumbersManager from '../molecules/PhoneNumbersManager';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axios';
import { capitalizeWords } from '../../utils/stringUtils';

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
            <div className="animate-fadeIn">
                <p className="config-field__hint" style={{ marginBottom: '1rem' }}>
                    {t('delete_confirmation') || '¿Eliminar usuario?'} <strong>{formData.username}</strong>?
                    <br />
                    <span className="text-danger" style={{ fontWeight: 500 }}>{t('action_cannot_undone')}</span>
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
            <div className="animate-fadeIn" style={{ padding: '1rem', backgroundColor: 'var(--amber-50)', borderRadius: '0.75rem', border: '1px solid var(--amber-100)' }}>
                <p style={{ margin: 0, color: 'var(--amber-800)' }}>
                    ¿Reiniciar contraseña de <strong>{formData.username}</strong> al DNI (<strong>{formData.dni}</strong>)?
                </p>
            </div>
        );
    }

    if (type === 'RESET_MANUAL') {
        return (
            <div className="animate-fadeIn">
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
        <div className="config-flex config-flex--column config-flex--gap-4 animate-fadeIn">
            <div className="config-grid config-grid--2col">
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

            <div style={{ padding: '0.5rem 0', borderTop: '1px solid var(--gray-100)', borderBottom: '1px solid var(--gray-100)', margin: '0.5rem 0' }}>
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

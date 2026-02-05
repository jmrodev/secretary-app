import React, { useState } from 'react';
import FormGroup from '../molecules/FormGroup';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import Button from '../atoms/Button';
import PhoneNumbersManager from '../molecules/PhoneNumbersManager';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axios';

const UserForm = ({ type, formData, setFormData }) => {
    const { t } = useLanguage();

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    if (type === 'DELETE') {
        return (
            <div className="animate-fadeIn">
                <p className="text-slate-600 mb-4">
                    {t('delete_confirmation') || '¿Eliminar usuario?'} <strong>{formData.username}</strong>?
                    <br />
                    <span className="text-red-500 font-medium">{t('action_cannot_undone')}</span>
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
            <div className="animate-fadeIn p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="m-0 text-amber-800">
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
        <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="py-2 border-y border-slate-100 my-2">
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

import React from 'react';
import PhoneNumbersManager from '../../../components/molecules/PhoneNumbersManager';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import FormGroup from '../../../components/molecules/FormGroup';
import Input from '../../../components/atoms/Input';
import './ProfileEditor.css';

/**
 * ProfileEditor Feature Component.
 * Unified interface for managing personal and professional user data.
 * Refactored to follow BEM and Atomic Design standards.
 */
const ProfileEditor = ({
    user,
    t,
    formData,
    handleChange,
    handleUpdate,
    loading
}) => {
    if (loading || !user) return <div className="profile-editor__loading">{t('loading') || 'Cargando...'}</div>;

    if (user?.role === 'admin') {
        return (
            <div className="profile-editor animate-fadeIn">
                <div className="profile-editor__banner">
                    <div className="profile-editor__header-body">
                        <div className="profile-editor__avatar">
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="profile-editor__header-info">
                            <div className="profile-editor__badge">{t('admin')}</div>
                            <h1 className="profile-editor__title">
                                {user?.username}
                            </h1>
                            <p className="profile-editor__subtitle">
                                {t('system_admin_account')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="profile-editor__card">
                    <div className="profile-editor__section-title">
                        <Icon name="USERS" size="1.2rem" />
                        {t('admin_account_msg')}
                    </div>
                    <p><strong>{t('username')}:</strong> {user.username}</p>
                    <p><strong>{t('role_header')}:</strong> {user.role}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-editor animate-fadeIn">
            {/* Header Banner - Unified visual style across features */}
            <div className="profile-editor__banner">
                <div className="profile-editor__header-body">
                    <div className="profile-editor__avatar">
                        {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="profile-editor__header-info">
                        <div className="profile-editor__badge">{user?.role === 'doctor' ? t('medical_professional') : t('patient_account')}</div>
                        <h1 className="profile-editor__title">
                            {formData.fullName || user?.username}
                        </h1>
                        <p className="profile-editor__subtitle">
                            {user?.role === 'doctor' ? t('manage_medical_settings') : t('manage_patient_profile')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleUpdate}>
                <div className="profile-editor__grid">
                    {/* PERSONAL INFORMATION SECTION */}
                    <div className="profile-editor__card">
                        <div className="profile-editor__section-title">
                            <Icon name="PROFILE" size="1.2rem" />
                            {t('personal_information')}
                        </div>

                        <FormGroup label={t('username')}>
                            <Input value={user.username} disabled />
                        </FormGroup>

                        <FormGroup label={t('full_name')} required>
                            <Input
                                value={formData.fullName}
                                onChange={e => handleChange('fullName', e.target.value)}
                                placeholder="Juan Perez"
                                required
                            />
                        </FormGroup>

                        <FormGroup label={t('dni')}>
                            <Input
                                value={formData.dni}
                                onChange={e => handleChange('dni', e.target.value)}
                                placeholder="12.345.678"
                            />
                        </FormGroup>

                        <div className="profile-editor__phone-section">
                            <PhoneNumbersManager
                                phoneNumbers={formData.phoneNumbers}
                                onChange={(val) => handleChange('phoneNumbers', val)}
                            />
                        </div>
                    </div>

                    {/* ROLE-SPECIFIC INFORMATION SECTION */}
                    <div className="profile-editor__card">
                        <div className="profile-editor__section-title">
                            <Icon name={user?.role === 'doctor' ? 'DOCTORS' : 'DOCUMENTS'} size="1.2rem" />
                            {user?.role === 'doctor' ? t('professional_details') : t('medical_data')}
                        </div>

                        {user?.role === 'patient' && (
                            <FormGroup label={t('medical_history')}>
                                <Input
                                    type="textarea"
                                    rows={8}
                                    value={formData.medicalHistory}
                                    onChange={e => handleChange('medicalHistory', e.target.value)}
                                    placeholder="Allergies, chronic conditions, etc."
                                />
                            </FormGroup>
                        )}

                        {user?.role === 'doctor' && (
                            <p className="profile-editor__text-muted italic">
                                {t('doctor_settings_moved') || "Para configurar horarios y especialidad, contacte al administrador o use el panel de Doctores."}
                            </p>
                        )}
                    </div>
                </div>

                <div className="profile-editor__actions">
                    <Button type="submit" variant="primary" size="lg" icon={<Icon name="SAVE" />}>
                        {t('save_changes')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProfileEditor;

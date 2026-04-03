import React from 'react';
import PhoneNumbersManager from '../../../components/molecules/PhoneNumbersManager';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import './ProfileEditor.css';

/**
 * ProfileEditor Feature Component.
 * Unified interface for managing personal and professional user data.
 */
const ProfileEditor = ({
    user,
    t,
    formData,
    handleChange,
    handleUpdate,
    loading
}) => {
    if (loading) return <div className="profile-editor__loading">{t('loading') || 'Cargando...'}</div>;

    if (user.role === 'admin') {
        return (
            <div className="profile-editor animate-fadeIn">
                <div className="header-banner">
                    <div className="profile-editor__header-body">
                        <div className="avatar-xl">
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="profile-editor__header-info">
                            <div className="badge-glass">{t('admin')}</div>
                            <h1 className="profile-editor__title">
                                {user.username}
                            </h1>
                            <p className="profile-editor__subtitle">
                                {t('system_admin_account')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card mt-6">
                    <div className="section-title">
                        <Icon name="ADMIN" size="1.2rem" className="mr-2" />
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
            <div className="header-banner">
                <div className="profile-editor__header-body">
                    <div className="avatar-xl">
                        {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="profile-editor__header-info">
                        <div className="badge-glass">{user.role === 'doctor' ? t('medical_professional') : t('patient_account')}</div>
                        <h1 className="profile-editor__title">
                            {formData.fullName || user.username}
                        </h1>
                        <p className="profile-editor__subtitle">
                            {user.role === 'doctor' ? t('manage_medical_settings') : t('manage_patient_profile')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="mt-6">
                <div className="item-grid">
                    {/* PERSONAL INFORMATION SECTION */}
                    <div className="card h-full">
                        <div className="section-title">
                            <Icon name="PROFILE" size="1.2rem" className="mr-2" />
                            {t('personal_information')}
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('username')}</label>
                            <input className="form-control" value={user.username} disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('full_name')}</label>
                            <input
                                className="form-control"
                                value={formData.fullName}
                                onChange={e => handleChange('fullName', e.target.value)}
                                placeholder="Juan Perez"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('dni')}</label>
                            <input
                                className="form-control"
                                value={formData.dni}
                                onChange={e => handleChange('dni', e.target.value)}
                                placeholder="12.345.678"
                            />
                        </div>

                        <div className="profile-editor__phone-section">
                            <PhoneNumbersManager
                                phoneNumbers={formData.phoneNumbers}
                                onChange={(val) => handleChange('phoneNumbers', val)}
                            />
                        </div>
                    </div>

                    {/* ROLE-SPECIFIC INFORMATION SECTION */}
                    <div className="card h-full">
                        <div className="section-title">
                            <Icon name={user.role === 'doctor' ? 'DOCTOR' : 'DOCUMENTS'} size="1.2rem" className="mr-2" />
                            {user.role === 'doctor' ? t('professional_details') : t('medical_data')}
                        </div>

                        {user.role === 'patient' && (
                            <div className="form-group">
                                <label className="form-label">{t('medical_history')}</label>
                                <textarea
                                    className="form-control"
                                    rows="6"
                                    value={formData.medicalHistory}
                                    onChange={e => handleChange('medicalHistory', e.target.value)}
                                    placeholder="Allergies, chronic conditions, etc."
                                />
                            </div>
                        )}

                        {user.role === 'doctor' && (
                            <p className="text-muted italic">
                                {t('doctor_settings_moved') || "Para configurar horarios y especialidad, contacte al administrador o use el panel de Doctores."}
                            </p>
                        )}
                    </div>
                </div>

                <div className="profile-editor__actions">
                    <Button type="submit" variant="primary">
                        {t('save_changes')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProfileEditor;

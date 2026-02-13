import React from 'react';
import { useProfileController } from '../controllers/useProfileController';
import MainLayout from '../components/templates/MainLayout';
import PhoneNumbersManager from '../components/molecules/PhoneNumbersManager';
import Button from '../components/atoms/Button';
import Icon from '../components/atoms/Icon';
import './Profile.css';

const Profile = () => {
    const {
        user,
        t,
        loading,
        formData,
        handleChange,
        handleUpdate
    } = useProfileController();

    if (loading) return <div className="p-8 text-center">Cargando perfil...</div>;

    if (user.role === 'admin') {
        return (
            <MainLayout>
                <div className="header-banner">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="avatar-xl">
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="badge-glass mb-2">{t('admin')}</div>
                            <h1 className="text-3xl font-bold text-white mb-1" style={{ textShadow: 'none' }}>
                                {user.username}
                            </h1>
                            <p className="text-blue-100 m-0 opacity-90">
                                {t('system_admin_account')}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="section-title">
                        <Icon name="ADMIN" size="1.2rem" className="mr-2" />
                        {t('admin_account_msg')}
                    </div>
                    <p><strong>{t('username')}:</strong> {user.username}</p>
                    <p><strong>{t('role_header')}:</strong> {user.role}</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header Banner */}
            <div className="header-banner">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="avatar-xl">
                        {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="badge-glass mb-2">{user.role === 'doctor' ? t('medical_professional') : t('patient_account')}</div>
                        <h1 className="text-3xl font-bold text-white mb-1" style={{ textShadow: 'none' }}>
                            {formData.fullName || user.username}
                        </h1>
                        <p className="text-blue-100 m-0 opacity-90">
                            {user.role === 'doctor' ? t('manage_medical_settings') : t('manage_patient_profile')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleUpdate}>
                <div className="item-grid">
                    {/* LEFT COLUMN: Personal Info */}
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

                        <div className="form-group">
                            <label className="form-label">{t('address')}</label>
                            <input
                                className="form-control"
                                value={formData.address}
                                onChange={e => handleChange('address', e.target.value)}
                                placeholder="Calle 123, Ciudad"
                            />
                        </div>

                        <div className="mt-4">
                            <PhoneNumbersManager
                                phoneNumbers={formData.phoneNumbers}
                                onChange={(val) => handleChange('phoneNumbers', val)}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Professional / Medical Info */}
                    <div className="card h-full">
                        <div className="section-title">
                            <Icon name={user.role === 'doctor' ? 'DOCTOR' : 'DOCUMENTS'} size="1.2rem" className="mr-2" />
                            {user.role === 'doctor' ? t('professional_details') : t('medical_data')}
                        </div>

                        {user.role === 'patient' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">{t('insurance')}</label>
                                    <input
                                        className="form-control"
                                        value={formData.insurance}
                                        onChange={e => handleChange('insurance', e.target.value)}
                                        placeholder="Example: OSDE, Swiss Medical"
                                    />
                                </div>
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
                            </>
                        )}

                        {user.role === 'doctor' && (
                            <p className="text-muted italic">
                                {t('doctor_settings_moved') || "Para configurar horarios y especialidad, contacte al administrador o use el panel de Doctores."}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-8 mb-12">
                    <Button type="submit" variant="primary">
                        {t('save_changes')}
                    </Button>
                </div>
            </form>
        </MainLayout>
    );
};

export default Profile;

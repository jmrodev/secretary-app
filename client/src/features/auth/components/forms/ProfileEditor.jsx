import React from 'react';
import PhoneNumbersManager from '@/components/molecules/PhoneNumbersManager';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import FormGroup from '@/components/molecules/FormGroup';
import { Input } from '@/components/atoms/Input';
import styles from './ProfileEditor.module.css';

/**
 * ProfileEditor Feature Component.
 * Unified interface for managing personal and professional user data.
 * Refactored to follow BEM and Atomic Design standards.
 */
export const ProfileEditor = ({
    user,
    t,
    formData,
    handlers,
    loading,
    isAdmin, isDoctor, isPatient
}) => {
    const { handleProfileChange, handleUpdate } = handlers;
    if (loading || !user) return <div className={`${styles.ProfileEditor__loading}`}>{t('loading') || 'Cargando...'}</div>;

    if (isAdmin) {
        return (
            <div className={`${styles.ProfileEditor__root} animate-fade-in`}>
                <div className={`${styles.ProfileEditor__card}`}>
                    <div className={`${styles.ProfileEditor__sectionTitle}`}>
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
        <div className={`${styles.ProfileEditor__root} animate-fade-in`}>

            <form onSubmit={handleUpdate}>
                <div className={`${styles.ProfileEditor__grid}`}>
                    {/* PERSONAL INFORMATION SECTION */}
                    <div className={`${styles.ProfileEditor__card}`}>
                        <div className={`${styles.ProfileEditor__sectionTitle}`}>
                            <Icon name="PROFILE" size="1.2rem" />
                            {t('personal_information')}
                        </div>

                        <FormGroup label={t('username')}>
                            <Input value={user.username} disabled />
                        </FormGroup>

                        <FormGroup label={t('full_name')} required>
                            <Input
                                value={formData.fullName}
                                onChange={e => handleProfileChange('fullName', e.target.value)}
                                placeholder="Juan Perez"
                                required
                            />
                        </FormGroup>

                        <FormGroup label={t('dni')}>
                            <Input
                                value={formData.dni}
                                onChange={e => handleProfileChange('dni', e.target.value)}
                                placeholder="12.345.678"
                            />
                        </FormGroup>

                        <div className={`${styles.ProfileEditor__phoneSection}`}>
                            <PhoneNumbersManager
                                phoneNumbers={formData.phoneNumbers}
                                onChange={(val) => handleProfileChange('phoneNumbers', val)}
                            />
                        </div>
                    </div>

                    {/* ROLE-SPECIFIC INFORMATION SECTION */}
                    <div className={`${styles.ProfileEditor__card}`}>
                        <div className={`${styles.ProfileEditor__sectionTitle}`}>
                            <Icon name={isDoctor ? 'DOCTORS' : 'DOCUMENTS'} size="1.2rem" />
                            {isDoctor ? t('professional_details') : t('medical_data')}
                        </div>

                        {isPatient && (
                            <FormGroup label={t('medical_history')}>
                                <Input
                                    type="textarea"
                                    rows={8}
                                    value={formData.medicalHistory}
                                    onChange={e => handleProfileChange('medicalHistory', e.target.value)}
                                    placeholder="Allergies, chronic conditions, etc."
                                />
                            </FormGroup>
                        )}

                        {isDoctor && (
                            <p className="profile-editor__text-muted italic">
                                {t('doctor_settings_moved') || "Para configurar horarios y especialidad, contacte al administrador o use el panel de Doctores."}
                            </p>
                        )}
                    </div>
                </div>

                <div className={`${styles.ProfileEditor__actions}`}>
                    <Button type="submit" variant="primary" size="lg" icon={<Icon name="SAVE" />}>
                        {t('save_changes')}
                    </Button>
                </div>
            </form>
        </div>
    );
};

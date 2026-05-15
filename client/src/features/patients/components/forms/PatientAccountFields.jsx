import React from 'react';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import './PatientAccountFields.css';

/**
 * PatientAccountFields Molecule (Sub-Executor).
 * Contains username and password fields for new patient account creation.
 * Optimized for Bento Box layout.
 */
const PatientAccountFields = ({ formData, updatePatientData, t }) => {
    return (
        <article className="patient-account-fields">
            <header className="patient-account-fields__header">
                <Icon name="vpn_key" size="1.25rem" />
                <h3 className="patient-account-fields__title">{t('access_credentials')}</h3>
            </header>

            <div className="patient-account-fields__bento">
                <div className="patient-account-fields__group patient-account-fields__group--span-6">
                    <label className="patient-account-fields__label">{t('username')}</label>
                    <Input
                        type="text"
                        name="username"
                        className="patient-account-fields__field"
                        value={formData.username || ''}
                        onChange={updatePatientData}
                        required
                        autoComplete="off"
                        placeholder={t('username_placeholder')}
                    />
                </div>
                <div className="patient-account-fields__group patient-account-fields__group--span-6">
                    <label className="patient-account-fields__label">{t('password')}</label>
                    <Input
                        type="password"
                        name="password"
                        className="patient-account-fields__field"
                        value={formData.password || ''}
                        onChange={updatePatientData}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <footer className="patient-account-fields__security-note">
                <Icon name="security" size="1rem" />
                <p>{t('account_security_note')}</p>
            </footer>
        </article>
    );
};

export default PatientAccountFields;

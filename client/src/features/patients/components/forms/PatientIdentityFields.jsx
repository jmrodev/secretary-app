import React from 'react';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import './PatientIdentityFields.css';

/**
 * PatientIdentityFields Molecule (Sub-Executor).
 * Contains primary identification: first name, last name, DNI, and DOB.
 * Optimized for Bento Box layout.
 */
const PatientIdentityFields = ({ formData, updatePatientData, t }) => {
    return (
        <article className="patient-identity-fields">
            <header className="patient-identity-fields__header">
                <Icon name="person_outline" size="1.25rem" />
                <h3 className="patient-identity-fields__title">{t('legal_identity')}</h3>
            </header>

            <div className="patient-identity-fields__bento">
                <div className="patient-identity-fields__group patient-identity-fields__group--span-6">
                    <label className="patient-identity-fields__label">{t('first_name')}</label>
                    <Input
                        name="first_name"
                        className="patient-identity-fields__field"
                        value={formData.first_name || ''}
                        onChange={updatePatientData}
                        required
                        placeholder={t('first_name_placeholder')}
                    />
                </div>
                <div className="patient-identity-fields__group patient-identity-fields__group--span-6">
                    <label className="patient-identity-fields__label">{t('last_name')}</label>
                    <Input
                        name="last_name"
                        className="patient-identity-fields__field"
                        value={formData.last_name || ''}
                        onChange={updatePatientData}
                        required
                        placeholder={t('last_name_placeholder')}
                    />
                </div>
                <div className="patient-identity-fields__group patient-identity-fields__group--span-4">
                    <label className="patient-identity-fields__label">{t('dni')}</label>
                    <Input
                        name="dni"
                        className="patient-identity-fields__field"
                        value={formData.dni || ''}
                        onChange={updatePatientData}
                        required
                        placeholder="12.345.678"
                    />
                </div>
                <div className="patient-identity-fields__group patient-identity-fields__group--span-8">
                    <label className="patient-identity-fields__label">{t('dob')}</label>
                    <Input
                        type="date"
                        name="dob"
                        className="patient-identity-fields__field"
                        value={formData.dob || ''}
                        onChange={updatePatientData}
                    />
                </div>
            </div>

            <footer className="patient-identity-fields__note">
                <Icon name="info" size="1rem" />
                <p>{t('identity_verification_note')}</p>
            </footer>
        </article>
    );
};

export default PatientIdentityFields;

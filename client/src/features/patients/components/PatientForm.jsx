
import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';

// Local Feature Components
import PatientIdentityFields from '@/features/patients/components/PatientIdentityFields';
import PatientAccountFields from '@/features/patients/components/PatientAccountFields';
import PatientContactFields from '@/features/patients/components/PatientContactFields';
import PatientAddressFields from '@/features/patients/components/PatientAddressFields';
import PatientInstitutionFields from '@/features/patients/components/PatientInstitutionFields';
import PatientAdminFields from '@/features/patients/components/PatientAdminFields';
import './PatientForm.css';

/**
 * PatientForm Organism (Executor).
 * Orchestrates various molecules to provide a comprehensive patient management form.
 * Used for both creating and editing patients.
 */
const PatientForm = ({
    controller,
    onCancel,
    isEdit = false,
    isAdmin = false
}) => {
    const {
        formData,
        insurances,
        doctors,
        institutions,
        coveredByInstitution,
        isSubmitting,
        t,
        handlers
    } = controller;

    const {
        handleChange,
        handleManualValueChange,
        handleDoctorToggle,
        handlePhoneChange,
        handleInstitutionToggle,
        handleSubmit
    } = handlers;

    return (
        <form onSubmit={handleSubmit} className="patient-form" autoComplete="off">
            {/* Fake fields to stop Chrome Autosave */}
            <div className="visually-hidden">
                <input type="text" name="fake_user_trap" autoComplete="username" tabIndex={-1} />
                <input type="password" name="fake_pass_trap" autoComplete="new-password" tabIndex={-1} />
            </div>

            <PatientIdentityFields
                formData={formData}
                handleChange={handleChange}
                insurances={insurances}
                t={t}
            />

            {!isEdit && (
                <PatientAccountFields
                    formData={formData}
                    handleChange={handleChange}
                    t={t}
                />
            )}

            <PatientContactFields
                formData={formData}
                handleChange={handleChange}
                handlePhoneChange={handlePhoneChange}
                t={t}
            />

            <PatientInstitutionFields
                coveredByInstitution={coveredByInstitution}
                handleInstitutionToggle={handleInstitutionToggle}
                formData={formData}
                handleChange={handleChange}
                institutions={institutions}
                t={t}
            />

            <PatientAddressFields
                formData={formData}
                handleChange={handleChange}
                t={t}
            />

            <div className="patient-form__group">
                <label className="patient-form__label">{t('medical_history')}</label>
                <Input
                    type="textarea"
                    name="medical_history"
                    rows={3}
                    value={formData.medical_history || ''}
                    onChange={handleChange}
                />
            </div>

            {isAdmin && (
                <PatientAdminFields
                    formData={formData}
                    doctors={doctors}
                    handleDoctorToggle={handleDoctorToggle}
                    handleManualValueChange={handleManualValueChange}
                    handleChange={handleChange}
                    t={t}
                />
            )}

            <div className="patient-form__actions">
                {onCancel && (
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={onCancel}
                        icon={<Icon name="close" />}
                    >
                        {t('cancel')}
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="success"
                    className="patient-form__submit-btn"
                    disabled={isSubmitting}
                    icon={<Icon name="save" />}
                >
                    {isEdit ? t('save_changes') : t('create_account')}
                </Button>
            </div>
        </form >
    );
};

export default PatientForm;

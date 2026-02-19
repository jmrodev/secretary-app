import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

// Molecules
import PatientIdentityFields from '../molecules/PatientIdentityFields';
import PatientAccountFields from '../molecules/PatientAccountFields';
import PatientContactFields from '../molecules/PatientContactFields';
import PatientAddressFields from '../molecules/PatientAddressFields';
import PatientInstitutionFields from '../molecules/PatientInstitutionFields';
import PatientAdminFields from '../molecules/PatientAdminFields';

import './PatientForm.css';

/**
 * PatientForm Organism.
 * Orchestrates various molecules to provide a comprehensive patient management form.
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
                <textarea
                    name="medical_history"
                    className="patient-form__field"
                    rows="3"
                    value={formData.medical_history}
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
                    className="w-full md:w-auto"
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


import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

// Local Feature Components
import PatientIdentityFields from '@/features/patients/components/forms/PatientIdentityFields';
import PatientInsuranceFields from '@/features/patients/components/forms/PatientInsuranceFields';
import PatientAccountFields from '@/features/patients/components/forms/PatientAccountFields';
import PatientContactFields from '@/features/patients/components/forms/PatientContactFields';
import PatientAddressFields from '@/features/patients/components/forms/PatientAddressFields';
import PatientInstitutionFields from '@/features/patients/components/forms/PatientInstitutionFields';
import PatientAdminFields from '@/features/patients/components/forms/PatientAdminFields';
import PatientMedicalNotes from '@/features/patients/components/forms/PatientMedicalNotes';
import './PatientForm.css';



const STEPS = [
    { id: 'personal', labelKey: 'step_personal', icon: 'person' },
    { id: 'insurance', labelKey: 'step_insurance', icon: 'account_balance_wallet' },
    { id: 'address', labelKey: 'step_address', icon: 'map' },
    { id: 'contact', labelKey: 'step_contact', icon: 'alternate_email' },
    { id: 'medical', labelKey: 'step_medical', icon: 'medical_services' },
    { id: 'admin', labelKey: 'step_admin', icon: 'settings' }
];

/**
 * PatientForm Organism (Executor).
 * Orchestrates various molecules to provide a comprehensive patient management form.
 * Follows Arquitectura.md: Atomic Design, BEM, and Bento Box contrast.
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

    const [currentStep, setCurrentStep] = React.useState(0);
    const activeSteps = isAdmin ? STEPS : STEPS.filter(s => s.id !== 'admin');

    const nextStep = (e) => {
        e.preventDefault();
        if (currentStep < activeSteps.length - 1) setCurrentStep(prev => prev + 1);
    };

    const prevStep = (e) => {
        e.preventDefault();
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const renderStepContent = () => {
        const stepId = activeSteps[currentStep].id;

        switch (stepId) {
            case 'personal':
                return (
                    <section className="patient-form__step-content">
                        <PatientIdentityFields
                            formData={formData}
                            handleChange={handleChange}
                            t={t}
                        />
                        {!isEdit && (
                            <PatientAccountFields
                                formData={formData}
                                handleChange={handleChange}
                                t={t}
                            />
                        )}
                    </section>
                );
            case 'insurance':
                return (
                    <section className="patient-form__step-content">
                        <PatientInsuranceFields
                            formData={formData}
                            handleChange={handleChange}
                            insurances={insurances}
                            t={t}
                        />
                    </section>
                );
            case 'address':
                return (
                    <section className="patient-form__step-content">
                        <PatientAddressFields
                            formData={formData}
                            handleChange={handleChange}
                            t={t}
                        />
                    </section>
                );
            case 'contact':
                return (
                    <section className="patient-form__step-content">
                        <PatientContactFields
                            formData={formData}
                            handleChange={handleChange}
                            handlePhoneChange={handlePhoneChange}
                            t={t}
                        />
                    </section>
                );
            case 'medical':
                return (
                    <section className="patient-form__step-content">
                        <PatientInstitutionFields
                            coveredByInstitution={coveredByInstitution}
                            handleInstitutionToggle={handleInstitutionToggle}
                            formData={formData}
                            handleChange={handleChange}
                            institutions={institutions}
                            t={t}
                        />
                        <PatientMedicalNotes
                            formData={formData}
                            handleChange={handleChange}
                            t={t}
                        />
                    </section>
                );
            case 'admin':
                return (
                    <section className="patient-form__step-content">
                        <PatientAdminFields
                            formData={formData}
                            doctors={doctors}
                            handleDoctorToggle={handleDoctorToggle}
                            handleManualValueChange={handleManualValueChange}
                            handleChange={handleChange}
                            t={t}
                        />
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="patient-form" autoComplete="off">
            {/* 1. HEADER: Stepper Indicator (Fixed) */}
            <header className="patient-form__header">
                <nav className="patient-form__stepper">
                    {activeSteps.map((step, index) => (
                        <div 
                            key={step.id} 
                            className={`patient-form__step ${index === currentStep ? 'patient-form__step--active' : ''} ${index < currentStep ? 'patient-form__step--completed' : ''}`}
                            onClick={() => index < currentStep && setCurrentStep(index)}
                        >
                            <div className="patient-form__step-icon">
                                <Icon name={index < currentStep ? 'check' : step.icon} size="1.2rem" />
                            </div>
                            <span className="patient-form__step-label">{t(step.labelKey)}</span>
                        </div>
                    ))}
                </nav>
            </header>

            {/* 2. MAIN: Form Content (Scrollable) */}
            <main className="patient-form__main">
                {renderStepContent()}
            </main>

            {/* 3. FOOTER: Navigation Actions (Fixed) */}
            <footer className="patient-form__footer">
                <div className="patient-form__actions">
                    <div className="patient-form__actions-left">
                        {currentStep > 0 && (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={prevStep}
                                icon={<Icon name="arrow_back" />}
                            >
                                {t('back')}
                            </Button>
                        )}
                        {onCancel && currentStep === 0 && (
                            <Button
                                variant="link"
                                type="button"
                                onClick={onCancel}
                            >
                                {t('cancel')}
                            </Button>
                        )}
                    </div>

                    <div className="patient-form__actions-right">
                        {currentStep < activeSteps.length - 1 ? (
                            <Button
                                variant="primary"
                                type="button"
                                onClick={nextStep}
                                icon={<Icon name="arrow_forward" />}
                                iconPosition="right"
                            >
                                {t('next')}
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                variant="success"
                                className="patient-form__submit-btn"
                                disabled={isSubmitting}
                                icon={<Icon name="save" />}
                            >
                                {isEdit ? t('save_changes') : t('create_account')}
                            </Button>
                        )}
                    </div>
                </div>
            </footer>
        </form >
    );
};

export default PatientForm;

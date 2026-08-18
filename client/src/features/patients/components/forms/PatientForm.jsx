
import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';

// Local Feature Components
import { PatientIdentityFields } from '@/features/patients/components/forms/PatientIdentityFields';
import { PatientInsuranceFields } from '@/features/patients/components/forms/PatientInsuranceFields';
import { PatientAccountFields } from '@/features/patients/components/forms/PatientAccountFields';
import { PatientContactFields } from '@/features/patients/components/forms/PatientContactFields';
import { PatientAddressFields } from '@/features/patients/components/forms/PatientAddressFields';
import { PatientAdminFields } from '@/features/patients/components/forms/PatientAdminFields';
import { PatientMedicalNotes } from '@/features/patients/components/forms/PatientMedicalNotes';
import styles from './PatientForm.module.css';



const STEPS = [
    { id: 'personal', labelKey: 'step_personal', icon: 'person' },
    { id: 'insurance', labelKey: 'step_insurance', icon: 'account_balance_wallet' },
    { id: 'address', labelKey: 'step_address', icon: 'map' },
    { id: 'contact', labelKey: 'step_contact', icon: 'alternate_email' },
    { id: 'medical', labelKey: 'step_medical', icon: 'medical_services' },
    { id: 'admin', labelKey: 'Administración', icon: 'settings' }
];

/**
 * PatientForm Organism (Executor).
 * Orchestrates various molecules to provide a comprehensive patient management form.
 * Follows Arquitectura.md: Atomic Design, BEM, and Bento Box contrast.
 */
export const PatientForm = ({
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
        updatePatientData,
        setPatientValue,
        toggleDoctorAssignment,
        updatePhoneNumbers,
        toggleInstitutionCoverage,
        savePatient
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

    const stepId = activeSteps[currentStep].id;

    // --- Steps Mapping ---
    const stepContents = {
        personal: (
            <section className={`${styles.PatientForm__stepContent}`}>
                <PatientIdentityFields formData={formData} updatePatientData={updatePatientData} t={t} />
                {!isEdit && <PatientAccountFields formData={formData} updatePatientData={updatePatientData} t={t} />}
            </section>
        ),
        insurance: (
            <section className={`${styles.PatientForm__stepContent}`}>
                <PatientInsuranceFields formData={formData} updatePatientData={updatePatientData} insurances={insurances} t={t} />
            </section>
        ),
        address: (
            <section className={`${styles.PatientForm__stepContent}`}>
                <PatientAddressFields formData={formData} updatePatientData={updatePatientData} t={t} />
            </section>
        ),
        contact: (
            <section className={`${styles.PatientForm__stepContent}`}>
                <PatientContactFields formData={formData} updatePatientData={updatePatientData} updatePhoneNumbers={updatePhoneNumbers} t={t} />
            </section>
        ),
        medical: (
            <section className={`${styles.PatientForm__stepContent}`}>
                <PatientMedicalNotes formData={formData} updatePatientData={updatePatientData} institutions={institutions} t={t} />
            </section>
        ),
        admin: (
            <section className={`${styles.PatientForm__stepContent}`}>
                <PatientAdminFields
                    formData={formData}
                    doctors={doctors}
                    handleDoctorToggle={toggleDoctorAssignment}
                    handleManualValueChange={setPatientValue}
                    updateAdminFields={updatePatientData}
                    t={t}
                />
            </section>
        )
    };

    return (
        <form onSubmit={savePatient} className={`${styles.PatientForm__root}`} autoComplete="off">
            {/* 1. HEADER: Stepper Indicator (Fixed) */}
            <header className={`${styles.PatientForm__header}`}>
                <nav className={`${styles.PatientForm__stepper}`}>
                    {activeSteps.map((step, index) => {
                        const isClickable = index < currentStep;
                        return (
                            <div 
                                key={step.id} 
                                className={`${styles.PatientForm__step} ${index === currentStep ? styles.PatientForm__stepActive : ''} ${isClickable ? styles.PatientForm__stepCompleted : ''}`}
                                onClick={() => isClickable && setCurrentStep(index)}
                                onKeyDown={(e) => {
                                    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        setCurrentStep(index);
                                    }
                                }}
                                role="button"
                                tabIndex={isClickable ? 0 : -1}
                                aria-current={index === currentStep ? 'step' : undefined}
                            >
                                <div className={`${styles.PatientForm__stepIcon}`}>
                                    <Icon name={index < currentStep ? 'check' : step.icon} size="1.2rem" />
                                </div>
                                <span className={`${styles.PatientForm__stepLabel}`}>{t(step.labelKey)}</span>
                            </div>
                        );
                    })}
                </nav>
            </header>

            {/* 2. MAIN: Form Content (Scrollable) */}
            <main className={`${styles.PatientForm__main}`}>
                {stepContents[stepId] || null}
            </main>

            {/* 3. FOOTER: Navigation Actions (Fixed) */}
            <footer className={`${styles.PatientForm__footer}`}>
                <div className={`${styles.PatientForm__actions}`}>
                    <div className={`${styles.PatientForm__actionsLeft}`}>
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

                    <div className={`${styles.PatientForm__actionsRight}`}>
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


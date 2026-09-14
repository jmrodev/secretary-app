
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
    { id: 'admin', labelKey: 'step_admin', icon: 'settings' }
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
    isAdmin = false,
    initialStep = null
}) => {
    const {
        formData,
        insurances,
        doctors,
        institutions,
        isSubmitting,
        t,
        handlers
    } = controller;

    const {
        updatePatientData,
        setPatientValue,
        toggleDoctorAssignment,
        updatePhoneNumbers,
        savePatient
    } = handlers;

    const activeSteps = React.useMemo(() => (
        isAdmin ? STEPS : STEPS.filter(s => s.id !== 'admin')
    ), [isAdmin]);

    const getStepIndex = React.useCallback((step) => {
        if (step === null || step === undefined) return 0;
        if (typeof step === 'number') return Math.max(0, Math.min(step, activeSteps.length - 1));
        const found = activeSteps.findIndex(s => s.id === step);
        return found !== -1 ? found : 0;
    }, [activeSteps]);

    const [currentStep, setCurrentStep] = React.useState(() => getStepIndex(initialStep));

    const missingSteps = React.useMemo(() => {
        const missing = new Set();
        if (!formData?.dni || !formData?.first_name || !formData?.last_name) missing.add('personal');
        if (!formData?.street_name || !formData?.street_number) missing.add('address');
        const hasPhone = formData?.phone || (Array.isArray(formData?.phoneNumbers) && formData.phoneNumbers.length > 0);
        if (!hasPhone) missing.add('contact');
        return missing;
    }, [formData]);

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
                        const isStepMissing = missingSteps.has(step.id);
                        return (
                            <div 
                                key={step.id} 
                                className={`${styles.PatientForm__step} ${index === currentStep ? styles.PatientForm__stepActive : ''} ${index < currentStep ? styles.PatientForm__stepCompleted : ''}`}
                                onClick={() => setCurrentStep(index)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setCurrentStep(index);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-current={index === currentStep ? 'step' : undefined}
                            >
                                <div className={`${styles.PatientForm__stepIcon}`}>
                                    <Icon name={index < currentStep && !isStepMissing ? 'check' : step.icon} size="1.2rem" />
                                    {isStepMissing && (
                                        <span className={styles.PatientForm__stepMissingDot} aria-hidden="true" />
                                    )}
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
                                className={styles.PatientForm__submitBtn}
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


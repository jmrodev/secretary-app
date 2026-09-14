import React from 'react';
import { Select } from '@/components/atoms/Select';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';
import { Checkbox } from '@/components/atoms/Checkbox';
import { AppointmentTypeSelector } from '../forms/AppointmentTypeSelector';
import { AppointmentPatientSection } from './AppointmentPatientSection';
import styles from './AppointmentFormFields.module.css';

/**
 * AppointmentFormFields (Minimalist ECC Version).
 * Decoupled structure using handlers and optional slot components.
 */
export const AppointmentFormFields = ({
    user, doctors, selectedDoctor, type, 
    selectedPatient, selectedPatientData, missingData, onOpenEditPatient,
    date, isOutOfHours, selectedInstitution, institutions,
    reason, bonified, handlers, t,
    PatientSearchSelectComponent
}) => {
    const { handleDateChange, handleDoctorChange, handlePatientChange, handleTypeChange,
            handleInstitutionChange, handleReasonChange, handleBonifiedChange, handlePhoneChange } = handlers;

    const institutionOptions = [
        {
            value: '',
            label: selectedPatientData
                ? `${t('institution')} (${selectedPatientData.institution_name || t('none')})`
                : t('institution_or_insurance')
        },
        { value: 'none', label: t('private_no_institution') },
        ...institutions.map(inst => ({ value: inst.id, label: inst.name }))
    ];

    return (
        <div className={styles.AppointmentFormFields__grid}>
            
            {/* 1. Patient Section */}
            <div className={`${styles.AppointmentFormFields__panel} ${styles.AppointmentFormFields__fieldFull}`}>
                <AppointmentPatientSection
                    selectedPatient={selectedPatient}
                    selectedPatientData={selectedPatientData}
                    missingData={missingData}
                    handlePatientChange={handlePatientChange}
                    handlePhoneChange={handlePhoneChange}
                    onOpenEditPatient={onOpenEditPatient}
                    t={t}
                    PatientSearchSelectComponent={PatientSearchSelectComponent}
                />
            </div>

            {/* 2. Professional & Schedule */}
            <div className={styles.AppointmentFormFields__panel}>
                <div className={styles.AppointmentFormFields__field}>
                    <label htmlFor="appointment-doctor" className={styles.AppointmentFormFields__label}>{t('doctor')}</label>
                    {user?.role === 'doctor' ? (
                        <div className={styles.AppointmentFormFields__readOnlyField}>
                            {doctors.find(d => String(d.id) === String(selectedDoctor))?.full_name || t('you')}
                        </div>
                    ) : (
                        <Select
                            id="appointment-doctor"
                            value={selectedDoctor || ''}
                            onChange={handleDoctorChange}
                            options={doctors.map(d => ({ value: d.id, label: d.full_name }))}
                            placeholder={t('select_doctor')}
                            required
                        />
                    )}
                </div>

                <div className={styles.AppointmentFormFields__field}>
                    <label htmlFor="appointment-date" className={styles.AppointmentFormFields__label}>{t('date_time')}</label>
                    <Input id="appointment-date" type="datetime-local" value={date} onChange={handleDateChange} required />
                    {isOutOfHours && (
                        <div className={`${styles.AppointmentFormFields__extraBadge} ${styles.AppointmentFormFields__extraBadgePulse}`}>
                            <Icon name="warning" size="1rem" />
                            {t('out_of_hours_appointment')}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Details & Type */}
            <div className={styles.AppointmentFormFields__panel}>
                <div className={styles.AppointmentFormFields__field}>
                    <span className={styles.AppointmentFormFields__label}>{t('appointment_type')}</span>
                    <AppointmentTypeSelector type={type} onChange={handleTypeChange} t={t} />
                </div>

                <div className={styles.AppointmentFormFields__field}>
                    <label htmlFor="appointment-institution" className={styles.AppointmentFormFields__label}>{t('institution')}</label>
                    <Select
                        id="appointment-institution"
                        value={selectedInstitution}
                        onChange={handleInstitutionChange}
                        options={institutionOptions}
                    />
                </div>
            </div>

            {/* 4. Notes & Bonification */}
            <div className={`${styles.AppointmentFormFields__panel} ${styles.AppointmentFormFields__fieldFull}`}>
                <div className={styles.AppointmentFormFields__field}>
                    <label htmlFor="appointment-reason" className={styles.AppointmentFormFields__label}>{t('reason')}</label>
                    <Input
                        id="appointment-reason"
                        type="textarea"
                        rows="2"
                        value={reason}
                        onChange={handleReasonChange}
                        placeholder={t('reason_placeholder')}
                        required
                    />
                </div>
                
                <Checkbox
                    id="appointment-bonified"
                    checked={bonified}
                    onChange={e => handleBonifiedChange(e.target.checked)}
                    label={t('bonified_label')}
                />
            </div>
        </div>
    );
};

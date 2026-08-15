import React from 'react';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import { AppointmentTypeSelector } from '../forms/AppointmentTypeSelector';
import { AppointmentPatientSection } from './AppointmentPatientSection';
import styles from '../modals/AppointmentFormModal.module.css';

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
        { value: '', label: selectedPatientData ? `Institución (${selectedPatientData.institution_name || 'Ninguna'})` : 'Institución / Obra Social' },
        { value: 'none', label: 'Particular / Sin Institución' },
        ...institutions.map(inst => ({ value: inst.id, label: inst.name }))
    ];

    return (
        <div className={styles.grid}>
            
            {/* 1. Patient Section */}
            <div className={`${styles.panel} ${styles.fieldFull}`}>
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
            <div className={styles.panel}>
                <div className={styles.field}>
                    <label className={styles.label}>{t('doctor') || 'Doctor'}</label>
                    {user?.role === 'doctor' ? (
                        <div className={styles.readOnlyField}>
                            {doctors.find(d => String(d.id) === String(selectedDoctor))?.full_name || 'Usted'}
                        </div>
                    ) : (
                        <Select
                            value={selectedDoctor || ''}
                            onChange={handleDoctorChange}
                            options={doctors.map(d => ({ value: d.id, label: d.full_name }))}
                            placeholder="Seleccionar Doctor"
                            required
                        />
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>{t('date_time') || 'Fecha y Hora'}</label>
                    <Input type="datetime-local" value={date} onChange={handleDateChange} required />
                    {isOutOfHours && (
                        <div className={`${styles.extraBadge} ${styles.extraBadgePulse}`}>
                            <Icon name="warning" size="1rem" />
                            Turno Fuera de Horario
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Details & Type */}
            <div className={styles.panel}>
                <div className={styles.field}>
                    <label className={styles.label}>{t('appointment_type') || 'Tipo de Turno'}</label>
                    <AppointmentTypeSelector type={type} onChange={handleTypeChange} t={t} />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>{t('institution') || 'Obra Social / Institución'}</label>
                    <Select
                        value={selectedInstitution}
                        onChange={handleInstitutionChange}
                        options={institutionOptions}
                    />
                </div>
            </div>

            {/* 4. Notes & Bonification */}
            <div className={`${styles.panel} ${styles.fieldFull}`}>
                <div className={styles.field}>
                    <label className={styles.label}>{t('reason') || 'Motivo y Notas'}</label>
                    <Input
                        type="textarea"
                        rows="1"
                        value={reason}
                        onChange={handleReasonChange}
                        placeholder={t('reason_placeholder') || 'Ingrese el motivo...'}
                        required
                    />
                </div>
                
                <div className={styles.checkboxContainer} onClick={() => handleBonifiedChange(!bonified)}>
                    <input
                        type="checkbox"
                        checked={bonified}
                        onChange={e => handleBonifiedChange(e.target.checked)}
                        className={styles.checkbox}
                    />
                    <label className={styles.checkboxLabel}>
                        {t('bonified_label') || 'Bonificar este turno (Sin costo)'}
                    </label>
                </div>
            </div>
        </div>
    );
};

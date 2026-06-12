import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/features/auth';

import AppointmentSyncAlert from '../ui/AppointmentSyncAlert.jsx';
import { AppointmentFormFields } from '../sections/AppointmentFormFields.jsx';

import styles from './AppointmentFormModal.module.css';

/**
 * AppointmentFormModal (Executor Component).
 * Main form for creating and editing medical appointments.
 */
const AppointmentFormModal = ({
    isOpen, onClose, onSubmit, selectedDoctor, doctors, type, selectedPatient, selectedPatientData,
    date, reason, bonified, selectedInstitution, institutions, syncReferenceInfo, onOpenEditPatient,
    missingData, editModeId, isOutOfHours, handlers,
    PatientSearchSelectComponent
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { handleDateChange, handleDoctorChange, handlePatientChange, handleTypeChange,
            handleInstitutionChange, handleReasonChange, handleBonifiedChange, handlePhoneChange } = handlers;



    const institutionOptions = [
        { value: '', label: selectedPatientData ? `Institución del Paciente (${selectedPatientData.institution_name || 'Ninguna'})` : 'Institución del Paciente' },
        { value: 'none', label: 'Particular / Sin Institución' },
        ...institutions.map(inst => ({ value: inst.id, label: inst.name }))
    ];

    return (
        <Modal
            isOpen={isOpen} onClose={onClose}
            title={editModeId ? (t('edit_appointment') || 'Editar Turno') : t('new_appointment')}
            size="2xl"
        >
            <form onSubmit={onSubmit} id="new-appointment-form" className={`${styles.root}`} autoComplete="off">
                <div className={styles.autofillTrap}>
                    <input type="text" name="fake_user_trap_appt" autoComplete="username" tabIndex={-1} readOnly />
                    <input type="password" name="fake_pass_trap_appt" autoComplete="new-password" tabIndex={-1} readOnly />
                </div>

                <AppointmentSyncAlert info={syncReferenceInfo} />

                    <AppointmentFormFields
                        user={user}
                        doctors={doctors}
                        selectedDoctor={selectedDoctor}
                        handleDoctorChange={handleDoctorChange}
                        type={type}
                        handleTypeChange={handleTypeChange}
                        selectedPatient={selectedPatient}
                        selectedPatientData={selectedPatientData}
                        missingData={missingData}
                        handlePatientChange={handlePatientChange}
                        handlePhoneChange={handlePhoneChange}
                        onOpenEditPatient={onOpenEditPatient}
                        date={date}
                        handleDateChange={handleDateChange}
                        isOutOfHours={isOutOfHours}
                        selectedInstitution={selectedInstitution}
                        institutionOptions={institutionOptions}
                        handleInstitutionChange={handleInstitutionChange}
                        reason={reason}
                        handleReasonChange={handleReasonChange}
                        bonified={bonified}
                        handleBonifiedChange={handleBonifiedChange}
                        t={t}
                        PatientSearchSelectComponent={PatientSearchSelectComponent}
                    />

                <div className={`${styles.actions}`}>
                    <Button type="submit" variant="accent" className={`${styles.submit}`}>
                        {editModeId ? (t('save_changes') || 'Guardar Cambios') : t('confirm_booking')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentFormModal;

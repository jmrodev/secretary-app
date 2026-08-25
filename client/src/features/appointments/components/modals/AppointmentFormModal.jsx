import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/features/auth/AuthContext';

import { AppointmentSyncAlert } from '../ui/AppointmentSyncAlert.jsx';
import { AppointmentFormFields } from '../sections/AppointmentFormFields.jsx';

import styles from './AppointmentFormModal.module.css';

/**
 * AppointmentFormModal (ECC Optimized).
 * Minimalist version, removed redundant traps and headers.
 */
export const AppointmentFormModal = ({
    isOpen, onClose, onSubmit, selectedDoctor, doctors, type, selectedPatient, selectedPatientData,
    date, reason, bonified, selectedInstitution, institutions, syncReferenceInfo, onOpenEditPatient,
    missingData, editModeId, isOutOfHours, handlers,
    PatientSearchSelectComponent
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen} 
            onClose={onClose}
            title={editModeId ? (t('edit_appointment') || 'Editar Turno') : t('new_appointment')}
            size="lg"
            footer={
                <Button 
                    type="submit" 
                    form="new-appointment-form"
                    variant="accent" 
                    className={styles.AppointmentFormModal__submit} 
                    icon={<Icon name="check" />}
                >
                    {editModeId ? (t('save_changes') || 'Guardar') : t('confirm_booking')}
                </Button>
            }
        >
            <form onSubmit={onSubmit} id="new-appointment-form" className={styles.AppointmentFormModal__root} autoComplete="off">
                <div className={styles.AppointmentFormModal__content}>
                    <AppointmentSyncAlert info={syncReferenceInfo} />
                    
                    <AppointmentFormFields
                        user={user}
                        doctors={doctors}
                        selectedDoctor={selectedDoctor}
                        type={type}
                        selectedPatient={selectedPatient}
                        selectedPatientData={selectedPatientData}
                        missingData={missingData}
                        onOpenEditPatient={onOpenEditPatient}
                        date={date}
                        isOutOfHours={isOutOfHours}
                        selectedInstitution={selectedInstitution}
                        institutions={institutions}
                        reason={reason}
                        bonified={bonified}
                        handlers={handlers}
                        t={t}
                        PatientSearchSelectComponent={PatientSearchSelectComponent}
                    />
                </div>
            </form>
        </Modal>
    );
};


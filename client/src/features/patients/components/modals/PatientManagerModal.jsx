
import React from 'react';
import Modal from '@/components/molecules/Modal';
import PatientForm from '@/features/patients/components/forms/PatientForm';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import { usePatientFormController } from '@/features/patients/hooks/usePatientFormController';
import styles from './PatientManagerModal.module.css';

const EMPTY_ARRAY = [];

/**
 * PatientManagerModal Molecule (Executor).
 * Orchestrator modal for adding or editing a patient.
 */
const PatientManagerModal = ({
    isOpen,
    onClose,
    patient,
    onUpdate,
    referenceInfo,
    insurances = EMPTY_ARRAY,
    doctors = EMPTY_ARRAY
}) => {
    const isEdit = !!(patient && patient.id);

    const controller = usePatientFormController({
        initialValues: patient,
        onClose,
        onUpdate,
        isEdit,
        providedInsurances: insurances,
        providedDoctors: doctors
    });

    const {
        loadingData,
        t
    } = controller;

    const title = isEdit ? t('edit_patient') : t('register_new_patient');
    const baseClass = styles.root;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
        >
            <article className={`${baseClass} ${baseClass}--full-width`}>
                {referenceInfo && !isEdit && (
                    <header className={`${baseClass}__reference`}>
                        <span className={`${baseClass}__reference-label`}>
                            <Icon name="description" size="1.2rem" />
                            {t('appointment_info_reference')}
                        </span>
                        <div className={`${baseClass}__reference-content`}>
                            {referenceInfo}
                        </div>
                    </header>
                )}

                {loadingData ? (
                    <Loading text={t('loading_data')} />
                ) : (
                    <PatientForm
                        controller={controller}
                        onCancel={onClose}
                        isEdit={isEdit}
                        isAdmin={true}
                    />
                )}
            </article>
        </Modal>
    );
};

export default PatientManagerModal;

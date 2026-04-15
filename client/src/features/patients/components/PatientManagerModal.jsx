
import React from 'react';
import Modal from '@/components/molecules/Modal';
import PatientForm from './PatientForm';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import { usePatientFormController } from '../hooks/usePatientFormController';
import './PatientManagerModal.css';

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
    insurances = [],
    doctors = []
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

    const title = isEdit ? (t('edit_patient') || 'Editar Paciente') : (t('register_new_patient') || 'Registrar Nuevo Paciente');
    const baseClass = 'patient-manager-modal';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
        >
            <article className={baseClass}>
                <h2 className="visually-hidden">{title}</h2>
                {referenceInfo && !isEdit && (
                    <header className={`${baseClass}__reference`}>
                        <span className={`${baseClass}__reference-label`}>
                            <Icon name="description" size="1.2rem" />
                            {t('appointment_info_reference') || 'Info de Turno (Referencia)'}
                        </span>
                        <div className={`${baseClass}__reference-content`}>
                            {referenceInfo}
                        </div>
                    </header>
                )}

                {loadingData ? (
                    <Loading text={t('loading_data') || 'Cargando datos...'} />
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

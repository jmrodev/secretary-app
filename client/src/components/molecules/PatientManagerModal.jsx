import React from 'react';
import Modal from './Modal';
import PatientForm from '../organisms/PatientForm';
import Loading from '../atoms/Loading';
import { usePatientFormController } from '../../controllers/usePatientFormController';
import './PatientManagerModal.css';

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
            <div className={baseClass}>
                {referenceInfo && !isEdit && (
                    <div className={`${baseClass}__reference`}>
                        <span className={`${baseClass}__reference-label`}>
                            📄 {t('appointment_info_reference') || 'Info de Turno (Referencia)'}
                        </span>
                        <div className={`${baseClass}__reference-content`}>
                            {referenceInfo}
                        </div>
                    </div>
                )}

                {!loadingData ? (
                    <PatientForm
                        controller={controller}
                        onCancel={onClose}
                        isEdit={isEdit}
                        isAdmin={true}
                    />
                ) : (
                    <div className={`${baseClass}__loading`}>
                        <Loading variant="centered" text={t('loading')} />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PatientManagerModal;

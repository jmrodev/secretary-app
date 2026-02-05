import React from 'react';
import Modal from './Modal';
import PatientForm from '../organisms/PatientForm';
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
        insurances: controllerInsurances,
        doctors: controllerDoctors,
        loadingData,
        t
    } = controller;

    // Determine Modal Title
    const title = isEdit ? (t('edit_patient') || 'Edit Patient') : (t('register_new_patient') || 'Register Patient');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
        >
            {/* Reference Info Block */}
            {referenceInfo && !isEdit && (
                <div className="reference-box">
                    <span className="reference-box__label">📄 Info de Turno (Referencia)</span>
                    <div className="reference-box__content">
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
                <div className="patient-manager-modal__loading">
                    {t('loading')}
                </div>
            )}
        </Modal>
    );
};

export default PatientManagerModal;

import React from 'react';
import Modal from './Modal';
import PatientForm from '../organisms/PatientForm';
import { usePatientFormController } from '../../controllers/usePatientFormController';

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
                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-top-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">📄 Info de Turno (Referencia)</span>
                    <div className="text-sm font-bold text-amber-900 leading-tight">
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
                <div className="p-8 flex justify-center text-gray-400">
                    {t('loading')}
                </div>
            )}
        </Modal>
    );
};

export default PatientManagerModal;

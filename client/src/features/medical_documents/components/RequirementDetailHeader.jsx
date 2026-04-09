import React from 'react';
import Icon from '@/components/atoms/Icon';

/**
 * RequirementDetailHeader Feature Molecule.
 * Displays critical patient and doctor information at the top of a requirement detail view.
 * Part of the documentary review workflow in medical_documents.
 */
const RequirementDetailHeader = ({ selectedRequest }) => {
    return (
        <header className="requirements-detail__header animate-fadeIn">
            <div className="requirements-detail__patient">
                <span className="requirements-detail__patient-name font-bold text-lg block">{selectedRequest.patient_name}</span>
                {selectedRequest.patient_dni && (
                    <small className="requirements-detail__patient-dni text-gray-500 font-medium">DNI: {selectedRequest.patient_dni}</small>
                )}
            </div>
            <div className="requirements-detail__doctor flex items-center gap-2 text-gray-600 mt-2">
                <Icon name="medical_services" size="1.1rem" color="var(--accent-color)" />
                <span className="font-medium">Dr. {selectedRequest.doctor_name}</span>
            </div>
        </header>
    );
};

export default RequirementDetailHeader;

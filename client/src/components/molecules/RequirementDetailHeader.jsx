import React from 'react';
import Icon from '../atoms/Icon';

/**
 * RequirementDetailHeader Molecule.
 * Renders the patient and doctor information at the top of the requirement detail view.
 */
const RequirementDetailHeader = ({ selectedRequest }) => {
    return (
        <header className="requirements-detail__header">
            <div className="requirements-detail__patient">
                <span className="requirements-detail__patient-name">{selectedRequest.patient_name}</span>
                <small className="requirements-detail__patient-dni">DNI: {selectedRequest.patient_dni}</small>
            </div>
            <div className="requirements-detail__doctor">
                <Icon name="medical_services" size="1rem" />
                <span>Dr. {selectedRequest.doctor_name}</span>
            </div>
        </header>
    );
};

export default RequirementDetailHeader;

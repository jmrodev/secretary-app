import Icon from '@/components/atoms/Icon';
import './RequirementDetailHeader.css';

/**
 * RequirementDetailHeader Feature Molecule.
 * Displays critical patient and doctor information at the top of a requirement detail view.
 * Part of the documentary review workflow in medical_documents.
 */
const RequirementDetailHeader = ({ selectedRequest }) => {
    return (
        <header className="requirements-detail__header animate-fade-in">
            <div className="requirements-detail__patient">
                <span className="requirements-detail__patient-name">{selectedRequest.patient_name}</span>
                {selectedRequest.patient_dni && (
                    <small className="requirements-detail__patient-dni">DNI: {selectedRequest.patient_dni}</small>
                )}
            </div>
            <div className="requirements-detail__doctor">
                <Icon name="medical_services" size="1.1rem" color="var(--accent-color)" />
                <span className="requirements-detail__doctor-name">Dr. {selectedRequest.doctor_name}</span>
            </div>
        </header>
    );
};

export default RequirementDetailHeader;

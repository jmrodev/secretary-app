import Icon from '@/components/atoms/Icon';
import styles from './RequirementDetailHeader.module.css';

/**
 * RequirementDetailHeader Feature Molecule.
 * Displays critical patient and doctor information at the top of a requirement detail view.
 * Part of the documentary review workflow in medical_documents.
 */
export const RequirementDetailHeader = ({ selectedRequest }) => {
    return (
        <header className={`${styles.header} animate-fade-in`}>
            <div className={`${styles.patient}`}>
                <span className={`${styles.patientName}`}>{selectedRequest.patient_name}</span>
                {selectedRequest.patient_dni && (
                    <small className={`${styles.patientDni}`}>DNI: {selectedRequest.patient_dni}</small>
                )}
            </div>
            <div className={`${styles.doctor}`}>
                <Icon name="medical_services" size="1.1rem" color="var(--accent-color)" />
                <span className="requirements-detail__doctor-name">Dr. {selectedRequest.doctor_name}</span>
            </div>
        </header>
    );
};


import React from 'react';
import Icon from '@/components/atoms/Icon';
import { PatientSearchSelect } from '@/features/patients';
import { capitalizeWords } from '@/utils/core/stringUtils';
import styles from './AppointmentPatientSection.module.css';

/**
 * AppointmentPatientSection Molecule (Internal to feature).
 * Orchestrates patient selection within the appointment form.
 */
const AppointmentPatientSection = ({
    selectedPatient, selectedPatientData, missingData, handlePatientChange, handlePhoneChange, onOpenEditPatient, t
}) => {
    return (
        <div className={`${styles.root}`}>
            <div className={styles.searchGroup}>
                <label className={styles.groupLabel}>{t('patients') || 'Paciente'}</label>
                <PatientSearchSelect
                    value={selectedPatient}
                    selectedData={selectedPatientData}
                    placeholder="Buscar Paciente..."
                    onCreatePatient={async (name) => {
                        handlePatientChange(null, { full_name: capitalizeWords(name) });
                        onOpenEditPatient();
                    }}
                    onChange={handlePatientChange}
                />
            </div>

            {missingData.length > 0 && (
                <div className={`${styles.missingAlert}`}>
                    <span className={`${styles.missingText}`}>
                        <Icon name="warning" size="1rem" />
                        <strong>Datos incompletos:</strong> {missingData.join(', ')}.
                    </span>
                    <button
                        type="button"
                        className={`${styles.missingAction}`}
                        onClick={onOpenEditPatient}
                    >
                        Completar
                    </button>
                </div>
            )}

            {selectedPatient && (
                <div className={`${styles.quickInfo}`}>
                    <div className={`${styles.field}`}>
                        <span className={`${styles.label}`}>
                            <Icon name="phone" size="1rem" />
                            Teléfono
                        </span>
                        <input
                            type="text"
                            className={`${styles.input}`}
                            value={selectedPatientData?.phone || ''}
                            onChange={e => handlePhoneChange(e.target.value)}
                            placeholder="Sin teléfono"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentPatientSection;

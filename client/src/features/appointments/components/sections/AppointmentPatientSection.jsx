import React from 'react';
import Icon from '@/components/atoms/Icon';
import { capitalizeWords } from '@/utils/core/stringUtils';
import styles from './AppointmentPatientSection.module.css';

/**
 * AppointmentPatientSection Molecule (ECC Optimized).
 * Compact version for the appointment form.
 * Decoupled via PatientSearchSelectComponent injection.
 */
const AppointmentPatientSection = ({
    selectedPatient, selectedPatientData, missingData, handlePatientChange, handlePhoneChange, onOpenEditPatient, t,
    PatientSearchSelectComponent
}) => {
    // Standard fallback if component is not injected (though injection is preferred)
    const PatientSearchSelect = PatientSearchSelectComponent;

    return (
        <div className={styles.root}>
            <div className={styles.searchGroup}>
                <label className={styles.groupLabel}>{t('patients') || 'Paciente'}</label>
                {PatientSearchSelect ? (
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
                ) : (
                    <div className="error-placeholder">Error: PatientSearchSelectComponent missing</div>
                )}
            </div>

            {missingData.length > 0 && (
                <div className={styles.missingAlert}>
                    <span className={styles.missingText}>
                        <Icon name="warning" size="0.9rem" />
                        <strong>Falta:</strong> {missingData.join(', ')}
                    </span>
                    <button type="button" className={styles.missingAction} onClick={onOpenEditPatient}>
                        Completar
                    </button>
                </div>
            )}

            {selectedPatient && (
                <div className={styles.quickInfo}>
                    <div className={styles.field}>
                        <span className={styles.label}>
                            <Icon name="phone" size="0.8rem" />
                            Teléfono del Paciente
                        </span>
                        <input
                            type="text"
                            className={styles.input}
                            value={selectedPatientData?.phone || ''}
                            onChange={e => handlePhoneChange(e.target.value)}
                            placeholder="Sin teléfono registrado"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentPatientSection;

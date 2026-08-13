import React from 'react';
import Icon from '@/components/atoms/Icon';
import PhoneInput from '@/components/molecules/PhoneInput';
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
            <div className={styles.fieldsRow}>
                <div className={styles.searchGroup}>
                    <label className={styles.groupLabel}>{t('patients') || 'Paciente'}</label>
                    {PatientSearchSelect ? (
                        <div style={{ maxWidth: '35ch', width: '100%' }}>
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
                    ) : (
                        <div className="error-placeholder">Error: PatientSearchSelectComponent missing</div>
                    )}
                </div>

                <div className={styles.searchGroup} style={{ width: '18ch', flexShrink: 0 }}>
                    <label className={styles.groupLabel}>
                        <Icon name="phone" size="0.8rem" style={{ marginRight: '0.35rem' }} />
                        Teléfono
                    </label>
                    <PhoneInput
                        value={selectedPatientData?.phone || ''}
                        onChange={newValue => handlePhoneChange(newValue)}
                        disabled={!selectedPatient}
                    />
                </div>
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


        </div>
    );
};

export default AppointmentPatientSection;

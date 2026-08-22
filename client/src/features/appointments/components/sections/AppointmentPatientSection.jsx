import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { PhoneInput } from '@/components/molecules/PhoneInput';
import { capitalizeWords } from '@/utils/core/stringUtils';
import styles from './AppointmentPatientSection.module.css';

/**
 * AppointmentPatientSection Molecule (ECC Optimized).
 * Compact version for the appointment form.
 * Decoupled via PatientSearchSelectComponent injection.
 */
export const AppointmentPatientSection = ({
    selectedPatient, selectedPatientData, missingData, handlePatientChange, handlePhoneChange, onOpenEditPatient, t,
    PatientSearchSelectComponent
}) => {
    // Standard fallback if component is not injected (though injection is preferred)
    const PatientSearchSelect = PatientSearchSelectComponent;

    return (
        <div className={styles.AppointmentPatientSection__root}>
            <div className={styles.AppointmentPatientSection__fieldsRow}>
                <div className={styles.AppointmentPatientSection__searchGroup}>
                    <label htmlFor="patient-search-input" className={styles.AppointmentPatientSection__groupLabel}>{t('patients') || 'Paciente'}</label>
                    {PatientSearchSelect ? (
                        <div style={{ maxWidth: '35ch', width: '100%' }}>
                            <PatientSearchSelect
                                value={selectedPatient}
                                selectedData={selectedPatientData}
                                placeholder={t('search_patient_placeholder') || "Buscar Paciente..."}
                                onCreatePatient={async (name) => {
                                    handlePatientChange(null, { full_name: capitalizeWords(name) });
                                    onOpenEditPatient();
                                }}
                                onChange={handlePatientChange}
                            />
                        </div>
                    ) : (
                        <div className="error-placeholder">{t('patient_search_component_missing') || "Error: PatientSearchSelectComponent missing"}</div>
                    )}
                </div>

                <div className={styles.AppointmentPatientSection__searchGroup} style={{ width: '18ch', flexShrink: 0 }}>
                    <span className={styles.AppointmentPatientSection__groupLabel}>
                        <Icon name="phone" size="0.8rem" style={{ marginRight: '0.35rem' }} />
                        {t('phone') || 'Teléfono'}
                    </span>
                    <PhoneInput
                        value={selectedPatientData?.phone || ''}
                        onChange={newValue => handlePhoneChange(newValue)}
                        disabled={!selectedPatient}
                    />
                </div>
            </div>

            {missingData.length > 0 && (
                <div className={styles.AppointmentPatientSection__missingAlert}>
                    <span className={styles.AppointmentPatientSection__missingText}>
                        <Icon name="warning" size="0.9rem" />
                        <strong>{t('missing_data_prefix') || 'Falta'}:</strong> {missingData.join(', ')}
                    </span>
                    <button type="button" className={styles.AppointmentPatientSection__missingAction} onClick={onOpenEditPatient}>
                        {t('complete') || 'Completar'}
                    </button>
                </div>
            )}


        </div>
    );
};


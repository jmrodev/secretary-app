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
                <div className={styles.AppointmentPatientSection__patientField}>
                    <label htmlFor="patient-search-input" className={styles.AppointmentPatientSection__groupLabel}>
                        <Icon name="person" size="0.85rem" />
                        {t('patients')}
                    </label>
                    {PatientSearchSelect ? (
                        <PatientSearchSelect
                            value={selectedPatient}
                            selectedData={selectedPatientData}
                            placeholder={t('search_patient_placeholder')}
                            onCreatePatient={async (name) => {
                                handlePatientChange(null, { full_name: capitalizeWords(name) });
                                onOpenEditPatient();
                            }}
                            onChange={handlePatientChange}
                        />
                    ) : (
                        <div className={styles.AppointmentPatientSection__errorPlaceholder}>
                            {t('patient_search_component_missing')}
                        </div>
                    )}
                </div>

                <div className={styles.AppointmentPatientSection__phoneField}>
                    <label htmlFor="appointment-phone-input" className={styles.AppointmentPatientSection__groupLabel}>
                        <Icon name="phone" size="0.85rem" />
                        {t('phone')}
                    </label>
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
                        <strong>{t('missing_data_prefix')}:</strong>{' '}
                        {missingData.map((item, idx) => {
                            const label = typeof item === 'string' ? item : item.label;
                            const step = typeof item === 'string' ? undefined : item.step;
                            return (
                                <React.Fragment key={typeof item === 'string' ? item : item.key || idx}>
                                    {idx > 0 && ', '}
                                    {step ? (
                                        <button
                                            type="button"
                                            className={styles.AppointmentPatientSection__missingItemBtn}
                                            onClick={() => onOpenEditPatient(step)}
                                        >
                                            {label}
                                        </button>
                                    ) : (
                                        <span>{label}</span>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </span>
                    <button
                        type="button"
                        className={styles.AppointmentPatientSection__missingAction}
                        onClick={() => onOpenEditPatient(typeof missingData[0] === 'object' ? missingData[0]?.step : undefined)}
                    >
                        {t('complete')}
                    </button>
                </div>
            )}


        </div>
    );
};


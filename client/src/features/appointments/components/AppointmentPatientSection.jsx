import React from 'react';
import { PatientSearchSelect } from '@/features/patients';
import { capitalizeWords } from '@/utils/stringUtils';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

/**
 * AppointmentPatientSection Molecule (Internal to feature).
 * Orchestrates patient selection within the appointment form.
 */
const AppointmentPatientSection = ({
    selectedPatient, selectedPatientData, missingData, handlePatientChange, handlePhoneChange, onOpenEditPatient, t
}) => {
    return (
        <div className="input-group">
            <label className="form-label">{t('patients')}</label>
            <PatientSearchSelect
                value={selectedPatient}
                selectedData={selectedPatientData}
                autoFocus={true}
                placeholder={t('search_patient')}
                onCreatePatient={async (name) => {
                    handlePatientChange(null, { full_name: capitalizeWords(name) });
                    onOpenEditPatient();
                }}
                onChange={handlePatientChange}
            />

            {missingData.length > 0 && (
                <div className="missing-data-alert">
                    <span className="missing-data-alert__text">
                        <Icon name="warning" size="1.2rem" />
                        <strong>{t('missing_data_alert')}:</strong> {missingData.join(', ')}.
                    </span>
                    <Button
                        variant="link"
                        size="sm"
                        className="missing-data-alert__action"
                        onClick={onOpenEditPatient}
                    >
                        {t('complete')}
                    </Button>
                </div>
            )}

            {selectedPatient && (
                <div className="patient-quick-info">
                    <div className="patient-quick-info__field">
                        <span className="patient-quick-info__label">
                            <Icon name="phone" size="1rem" /> {t('phone')}
                        </span>
                        <input
                            type="text"
                            className="patient-quick-info__input"
                            value={selectedPatientData?.phone || ''}
                            onChange={e => handlePhoneChange(e.target.value)}
                            placeholder={t('no_phone')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentPatientSection;

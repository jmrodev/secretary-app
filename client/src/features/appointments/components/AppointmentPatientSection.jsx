import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { PatientSearchSelect } from '@/features/patients';
import { capitalizeWords } from '@/utils/stringUtils';

/**
 * AppointmentPatientSection Molecule (Internal to feature).
 * Orchestrates patient selection within the appointment form.
 */
const AppointmentPatientSection = ({
    selectedPatient, selectedPatientData, missingData, handlePatientChange, handlePhoneChange, onOpenEditPatient, t
}) => {
    return (
        <div className="input-group">
            <label className="form-label">{t('patients') || 'Paciente'}</label>
            <PatientSearchSelect
                value={selectedPatient}
                selectedData={selectedPatientData}
                autoFocus={true}
                placeholder="Buscar Paciente..."
                onCreatePatient={async (name) => {
                    handlePatientChange(null, { full_name: capitalizeWords(name) });
                    onOpenEditPatient();
                }}
                onChange={handlePatientChange}
            />

            {missingData.length > 0 && (
                <div className="missing-data-alert">
                    <span className="missing-data-alert__text">
                        <Icon name="warning" size="1rem" className="mr-1" />
                        <strong>Datos incompletos:</strong> {missingData.join(', ')}.
                    </span>
                    <Button
                        type="button"
                        className="missing-data-alert__action"
                        onClick={onOpenEditPatient}
                        unstyled
                    >
                        Completar
                    </Button>
                </div>
            )}

            {selectedPatient && (
                <div className="patient-quick-info">
                    <div className="patient-quick-info__field">
                        <span className="patient-quick-info__label"><Icon name="phone" size="1rem" className="mr-1" />Teléfono</span>
                        <input
                            type="text"
                            className="patient-quick-info__input"
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

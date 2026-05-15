import React from 'react';
import Icon from '@/components/atoms/Icon';
import { PatientSearchSelect } from '@/features/patients';
import { capitalizeWords } from '@/utils/core/stringUtils';
import './AppointmentPatientSection.css';

/**
 * AppointmentPatientSection Molecule (Internal to feature).
 * Orchestrates patient selection within the appointment form.
 */
const AppointmentPatientSection = ({
    selectedPatient, selectedPatientData, missingData, handlePatientChange, handlePhoneChange, onOpenEditPatient, t
}) => {
    return (
        <div className="appointment-patient-section">
            <div className="appointment-patient-section__search-group">
                <label className="appointment-patient-section__group-label">{t('patients') || 'Paciente'}</label>
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
                <div className="appointment-patient-section__missing-alert">
                    <span className="appointment-patient-section__missing-text">
                        <Icon name="warning" size="1rem" />
                        <strong>Datos incompletos:</strong> {missingData.join(', ')}.
                    </span>
                    <button
                        type="button"
                        className="appointment-patient-section__missing-action"
                        onClick={onOpenEditPatient}
                    >
                        Completar
                    </button>
                </div>
            )}

            {selectedPatient && (
                <div className="appointment-patient-section__quick-info">
                    <div className="appointment-patient-section__field">
                        <span className="appointment-patient-section__label">
                            <Icon name="phone" size="1rem" />
                            Teléfono
                        </span>
                        <input
                            type="text"
                            className="appointment-patient-section__input"
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

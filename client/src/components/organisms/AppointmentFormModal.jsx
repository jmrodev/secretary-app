import React from 'react';
import Modal from '../molecules/Modal';
import PatientSearchSelect from '../molecules/PatientSearchSelect';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { capitalizeWords } from '../../utils/stringUtils';
import './AppointmentFormModal.css';

const AppointmentFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    selectedDoctor,
    doctors,
    type,
    selectedPatient,
    selectedPatientData,
    date,
    reason,
    bonified,
    selectedInstitution,
    institutions,
    syncReferenceInfo,
    onOpenEditPatient,
    missingData,
    editModeId,
    isOutOfHours,
    handlers
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    const {
        handleDateChange,
        handleDoctorChange,
        handlePatientChange,
        handleTypeChange,
        handleInstitutionChange,
        handleReasonChange,
        handleBonifiedChange,
        handlePhoneChange
    } = handlers;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editModeId ? (t('edit_appointment') || 'Editar Turno') : t('new_appointment')}
        >
            <form onSubmit={onSubmit} id="new-appointment-form" className="appointment-form-modal" autoComplete="off">
                {/* Fake fields to stop Chrome Autosave */}
                <div className="visually-hidden">
                    <input type="text" name="fake_user_trap_appt" autoComplete="username" tabIndex={-1} />
                    <input type="password" name="fake_pass_trap_appt" autoComplete="new-password" tabIndex={-1} />
                </div>
                {syncReferenceInfo && (
                    <div className="reference-box">
                        <span className="reference-box__label">📄 Información Original (Referencia)</span>
                        <div className="reference-box__content">
                            {syncReferenceInfo}
                        </div>
                        <p className="reference-box__hint">
                            Utilice esta información para buscar al paciente correcto.
                        </p>
                    </div>
                )}
                <div className="input-group">
                    <label className="form-label">{t('doctors')}</label>
                    {user.role === 'doctor' ? (
                        <div className="form-control form-control--disabled">
                            {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'You'}
                        </div>
                    ) : (
                        <select className="form-control" value={selectedDoctor || ''} onChange={e => handleDoctorChange(e.target.value)} required>
                            <option value="">{t('select_doctor')}</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="input-group">
                    <label className="form-label">Tipo de Turno</label>
                    <div className="appointment-type-selector">
                        <button
                            type="button"
                            className={`btn btn-sm ${type === 'consultation' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleTypeChange('consultation')}
                        >
                            🏢 Presencial
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${type === 'virtual' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleTypeChange('virtual')}
                        >
                            📹 Videollamada
                        </button>
                    </div>
                </div>

                {(user.role === 'secretary' || user.role === 'doctor') && (
                    <div className="input-group">
                        <label className="form-label">{t('patients')}</label>
                        <PatientSearchSelect
                            value={selectedPatient}
                            selectedData={selectedPatientData}
                            autoFocus={true}
                            placeholder={t('select_patient')}
                            onCreatePatient={async (name) => {
                                handlePatientChange(null, { full_name: capitalizeWords(name) });
                                onOpenEditPatient();
                            }}
                            onChange={handlePatientChange}
                        />
                        {missingData.length > 0 && (
                            <div className="missing-data-alert">
                                <span className="missing-data-alert__text">
                                    ⚠️ <strong>Datos incompletos:</strong> {missingData.join(', ')}.
                                </span>
                                <button
                                    type="button"
                                    className="missing-data-alert__action"
                                    onClick={onOpenEditPatient}
                                >
                                    Completar
                                </button>
                            </div>
                        )}

                        {selectedPatient && (
                            <div className="patient-quick-info">
                                <div className="patient-quick-info__field">
                                    <span className="patient-quick-info__label">📱 {t('phone') || 'Teléfono'}</span>
                                    <input
                                        type="text"
                                        className="patient-quick-info__input"
                                        value={selectedPatientData?.phone || ''}
                                        onChange={e => handlePhoneChange(e.target.value)}
                                        placeholder={t('no_phone') || 'Sin teléfono'}
                                    />
                                </div>
                                <div className="whatsapp-status">
                                    <span className={`whatsapp-status__indicator ${selectedPatientData?.phone ? 'whatsapp-status__indicator--active' : ''}`}></span>
                                    {selectedPatientData?.phone ? 'WHATSAPP OK' : 'SIN TEL.'}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="input-group">
                    <label className="form-label">{t('date_time')}</label>
                    <input type="datetime-local" className="form-control" value={date} onChange={e => handleDateChange(e.target.value)} required />
                    {isOutOfHours && (
                        <div className="appointment-form-modal__extra-badge animate-pulse">
                            ⚠️ {t('extra_turn_warning') || 'Turno Fuera de Horario (Extra)'}
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label className="form-label">{t('reason')}</label>
                    <textarea className="form-control" rows="3" value={reason} onChange={e => handleReasonChange(e.target.value)} required></textarea>
                </div>

                <div className="input-group">
                    <label className="form-label">{t('institution') || 'Institución'}</label>
                    <select
                        className="form-control"
                        value={selectedInstitution}
                        onChange={e => handleInstitutionChange(e.target.value)}
                    >
                        <option value="">
                            {selectedPatientData
                                ? `Institución del Paciente (${selectedPatientData.institution_name || 'Ninguna - Se usará Particular'})`
                                : t('patient_institution') || 'Institución del Paciente'}
                        </option>
                        <option value="none">{t('particular') || 'Particular / Sin Institución'}</option>
                        {institutions.map(inst => (
                            <option key={inst.id} value={inst.id}>
                                {inst.name}
                            </option>
                        ))}
                    </select>
                    <span className="text-xs text-muted mt-1">
                        {t('institution_help') || 'Dejar en "Por Defecto" para usar la obra social del perfil del paciente.'}
                    </span>
                </div>

                <div className="input-group checkbox-group">
                    <input
                        type="checkbox"
                        id="bonified"
                        checked={bonified}
                        onChange={e => handleBonifiedChange(e.target.checked)}
                        className="w-auto"
                    />
                    <label htmlFor="bonified" className="input-label checkbox-label">
                        {t('bonificado') || 'Bonificado (Free/Waived)'}
                    </label>
                </div>
                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-accent form-actions__submit"
                    >
                        {editModeId ? (t('save_changes') || 'Guardar Cambios') : t('confirm_booking')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentFormModal;

import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/features/auth';

import AppointmentSyncAlert from '@/features/appointments/components/AppointmentSyncAlert.jsx';
import AppointmentTypeSelector from '@/features/appointments/components/AppointmentTypeSelector.jsx';
import AppointmentPatientSection from '@/features/appointments/components/AppointmentPatientSection.jsx';

import './AppointmentFormModal.css';

/**
 * AppointmentFormModal (Executor Component).
 * Main form for creating and editing medical appointments.
 */
const AppointmentFormModal = ({
    isOpen, onClose, onSubmit, selectedDoctor, doctors, type, selectedPatient, selectedPatientData,
    date, reason, bonified, selectedInstitution, institutions, syncReferenceInfo, onOpenEditPatient,
    missingData, editModeId, isOutOfHours, handlers
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { handleDateChange, handleDoctorChange, handlePatientChange, handleTypeChange,
            handleInstitutionChange, handleReasonChange, handleBonifiedChange, handlePhoneChange } = handlers;

    return (
        <Modal
            isOpen={isOpen} onClose={onClose}
            title={editModeId ? (t('edit_appointment') || 'Editar Turno') : t('new_appointment')}
            size="2xl"
        >
            <form onSubmit={onSubmit} id="new-appointment-form" className="appointment-form-modal" autoComplete="off">
                <div style={{ position: 'absolute', opacity: 0, top: -1000, left: -1000, height: 0, width: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    <input type="text" name="fake_user_trap_appt" autoComplete="username" tabIndex={-1} />
                    <input type="password" name="fake_pass_trap_appt" autoComplete="new-password" tabIndex={-1} />
                </div>

                <AppointmentSyncAlert info={syncReferenceInfo} />

                <div className="input-group">
                    <label className="form-label">{t('doctors') || 'Doctor'}</label>
                    {user?.role === 'doctor' ? (
                        <div className="form-control form-control--disabled">
                            {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'Usted'}
                        </div>
                    ) : (
                        <select className="form-control" value={selectedDoctor || ''} onChange={e => handleDoctorChange(e.target.value)} required>
                            <option value="">Seleccionar Doctor</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>
                            ))}
                        </select>
                    )}
                </div>

                <AppointmentTypeSelector type={type} onChange={handleTypeChange} t={t} />

                {(user?.role === 'secretary' || user?.role === 'doctor') && (
                    <AppointmentPatientSection
                        selectedPatient={selectedPatient} selectedPatientData={selectedPatientData} missingData={missingData}
                        handlePatientChange={handlePatientChange} handlePhoneChange={handlePhoneChange}
                        onOpenEditPatient={onOpenEditPatient} t={t}
                    />
                )}

                <div className="input-group">
                    <label className="form-label">{t('date_time') || 'Fecha y Hora'}</label>
                    <input type="datetime-local" className="form-control" value={date} onChange={e => handleDateChange(e.target.value)} required />
                    {isOutOfHours && (
                        <div className="appointment-form-modal__extra-badge appointment-form-modal__extra-badge--pulse">
                            <Icon name="warning" size="1rem" className="mr-1" />
                            Turno Fuera de Horario (Extra)
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label className="form-label">{t('reason') || 'Motivo de Consulta'}</label>
                    <textarea className="form-control" rows="3" value={reason} onChange={e => handleReasonChange(e.target.value)} required></textarea>
                </div>

                <div className="input-group">
                    <label className="form-label">Obra Social / Institución</label>
                    <select className="form-control" value={selectedInstitution} onChange={e => handleInstitutionChange(e.target.value)}>
                        <option value="">
                            {selectedPatientData ? `Institución del Paciente (${selectedPatientData.institution_name || 'Ninguna'})` : 'Institución del Paciente'}
                        </option>
                        <option value="none">Particular / Sin Institución</option>
                        {institutions.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                    </select>
                </div>

                <div className="input-group checkbox-group">
                    <input type="checkbox" id="bonified" checked={bonified} onChange={e => handleBonifiedChange(e.target.checked)} className="appointment-form-modal__checkbox" />
                    <label htmlFor="bonified" className="input-label checkbox-label">Bonificado (Sin Costo)</label>
                </div>

                <div className="form-actions">
                    <Button type="submit" className="btn btn-accent form-actions__submit" unstyled>
                        {editModeId ? (t('save_changes') || 'Guardar Cambios') : t('confirm_booking')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentFormModal;

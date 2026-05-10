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
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';

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

    const doctorOptions = doctors.map(d => ({
        value: d.id,
        label: `${d.full_name} (${d.specialty})`
    }));

    const institutionOptions = [
        { value: '', label: selectedPatientData ? `Institución del Paciente (${selectedPatientData.institution_name || 'Ninguna'})` : 'Institución del Paciente' },
        { value: 'none', label: 'Particular / Sin Institución' },
        ...institutions.map(inst => ({ value: inst.id, label: inst.name }))
    ];

    return (
        <Modal
            isOpen={isOpen} onClose={onClose}
            title={editModeId ? (t('edit_appointment') || 'Editar Turno') : t('new_appointment')}
            size="2xl"
        >
            <form onSubmit={onSubmit} id="new-appointment-form" className="appointment-form-modal" autoComplete="off">
                <div className="appointment-form-modal__autofill-trap">
                    <input type="text" name="fake_user_trap_appt" autoComplete="username" tabIndex={-1} />
                    <input type="password" name="fake_pass_trap_appt" autoComplete="new-password" tabIndex={-1} />
                </div>

                <AppointmentSyncAlert info={syncReferenceInfo} />

                <div className="appointment-form-modal__grid">
                    <div className="appointment-form-modal__field">
                        <label className="appointment-form-modal__label">{t('doctors') || 'Doctor'}</label>
                        {user?.role === 'doctor' ? (
                            <div className="appointment-form-modal__read-only-field">
                                {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'Usted'}
                            </div>
                        ) : (
                            <Select
                                value={selectedDoctor || ''}
                                onChange={handleDoctorChange}
                                options={doctorOptions}
                                placeholder="Seleccionar Doctor"
                                required
                            />
                        )}
                    </div>

                    <div className="appointment-form-modal__field">
                        <label className="appointment-form-modal__label">{t('appointment_type') || 'Tipo de Turno'}</label>
                        <AppointmentTypeSelector type={type} onChange={handleTypeChange} t={t} />
                    </div>

                    <AppointmentPatientSection
                        selectedPatient={selectedPatient}
                        selectedPatientData={selectedPatientData}
                        missingData={missingData}
                        handlePatientChange={handlePatientChange}
                        handlePhoneChange={handlePhoneChange}
                        onOpenEditPatient={onOpenEditPatient}
                        t={t}
                    />

                    <div className="appointment-form-modal__field">
                        <label className="appointment-form-modal__label">{t('date_time') || 'Fecha y Hora'}</label>
                        <Input
                            type="datetime-local"
                            value={date}
                            onChange={handleDateChange}
                            required
                        />
                        {isOutOfHours && (
                            <div className="appointment-form-modal__extra-badge appointment-form-modal__extra-badge--pulse">
                                <Icon name="warning" size="1rem" />
                                Turno Fuera de Horario (Extra)
                            </div>
                        )}
                    </div>

                    <div className="appointment-form-modal__field">
                        <label className="appointment-form-modal__label">Obra Social / Institución</label>
                        <Select
                            value={selectedInstitution}
                            onChange={handleInstitutionChange}
                            options={institutionOptions}
                        />
                    </div>

                    <div className="appointment-form-modal__field appointment-form-modal__field--full">
                        <label className="appointment-form-modal__label">{t('reason') || 'Motivo de Consulta'}</label>
                        <Input
                            type="textarea"
                            rows="3"
                            value={reason}
                            onChange={handleReasonChange}
                            placeholder={t('reason_placeholder') || 'Ingrese el motivo...'}
                            required
                        />
                    </div>

                    <div className="appointment-form-modal__field appointment-form-modal__field--full">
                        <div
                            className="appointment-form-modal__checkbox-container"
                            onClick={() => handleBonifiedChange(!bonified)}
                        >
                            <input
                                type="checkbox"
                                id="bonified"
                                checked={bonified}
                                onChange={e => handleBonifiedChange(e.target.checked)}
                                className="appointment-form-modal__checkbox"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <label htmlFor="bonified" className="appointment-form-modal__checkbox-label">
                                Bonificado (Sin Costo)
                            </label>
                        </div>
                    </div>
                </div>

                <div className="appointment-form-modal__actions">
                    <Button type="submit" variant="accent" className="appointment-form-modal__submit">
                        {editModeId ? (t('save_changes') || 'Guardar Cambios') : t('confirm_booking')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentFormModal;

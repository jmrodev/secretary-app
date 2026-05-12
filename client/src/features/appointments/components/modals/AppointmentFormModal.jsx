import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/features/auth';

import AppointmentSyncAlert from '../ui/AppointmentSyncAlert.jsx';
import AppointmentTypeSelector from '../forms/AppointmentTypeSelector.jsx';
import AppointmentPatientSection from '../sections/AppointmentPatientSection.jsx';

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
                    <input type="text" name="fake_user_trap_appt" autoComplete="username" tabIndex={-1} readOnly />
                    <input type="password" name="fake_pass_trap_appt" autoComplete="new-password" tabIndex={-1} readOnly />
                </div>

                <AppointmentSyncAlert info={syncReferenceInfo} />

                <div className="appointment-form-modal__grid">
                    <div className="appointment-form-modal__field">
                        <label className="appointment-form-modal__label" htmlFor="doctor-select">{t('doctors') || 'Doctor'}</label>
                        {user?.role === 'doctor' ? (
                            <div className="appointment-form-modal__read-only-field">
                                {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'Usted'}
                            </div>
                        ) : (
                            <Select
                                id="doctor-select"
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
                        <label className="appointment-form-modal__label" htmlFor="appointment-date">{t('date_time') || 'Fecha y Hora'}</label>
                        <Input
                            id="appointment-date"
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
                        <label className="appointment-form-modal__label" htmlFor="institution-select">Obra Social / Institución</label>
                        <Select
                            id="institution-select"
                            value={selectedInstitution}
                            onChange={handleInstitutionChange}
                            options={institutionOptions}
                        />
                    </div>

                    <div className="appointment-form-modal__field appointment-form-modal__field--full">
                        <label className="appointment-form-modal__label" htmlFor="reason-textarea">{t('reason') || 'Motivo de Consulta'}</label>
                        <Input
                            id="reason-textarea"
                            type="textarea"
                            rows="3"
                            value={reason}
                            onChange={handleReasonChange}
                            placeholder={t('reason_placeholder') || 'Ingrese el motivo...'}
                            required
                        />
                    </div>

                    <div className="appointment-form-modal__field appointment-form-modal__field--full">
                        <div className="appointment-form-modal__checkbox-container">
                            <input
                                type="checkbox"
                                id="bonified"
                                checked={bonified}
                                onChange={e => handleBonifiedChange(e.target.checked)}
                                className="appointment-form-modal__checkbox"
                            />
                            <label htmlFor="bonified" className="appointment-form-modal__checkbox-label">
                                {t('bonified_label') || 'Bonificado (Sin Costo)'}
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

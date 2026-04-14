import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/features/auth';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Switch from '@/components/atoms/Switch';
import Icon from '@/components/atoms/Icon';

import AppointmentSyncAlert from './AppointmentSyncAlert.jsx';
import AppointmentTypeSelector from './AppointmentTypeSelector.jsx';
import AppointmentPatientSection from './AppointmentPatientSection.jsx';

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
            title={editModeId ? t('edit_appointment') : t('new_appointment')}
            size="2xl"
        >
            <form onSubmit={onSubmit} id="new-appointment-form" className="appointment-form-modal" autoComplete="off">
                <div className="appointment-form-modal__autofill-trap">
                    <Input type="text" name="fake_user_trap_appt" tabIndex={-1} />
                    <Input type="password" name="fake_pass_trap_appt" tabIndex={-1} />
                </div>


                <AppointmentSyncAlert info={syncReferenceInfo} />

                <div className="input-group">
                    <label className="form-label">{t('doctors')}</label>
                    {user?.role === 'doctor' ? (
                        <div className="form-control form-control--disabled">
                            {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'Usted'}
                        </div>
                    ) : (
                        <Select
                            value={selectedDoctor || ''}
                            onChange={e => handleDoctorChange(e.target.value)}
                            required
                            options={[
                                { value: '', label: t('select_doctor') },
                                ...doctors.map(d => ({ value: d.id, label: `${d.full_name} (${d.specialty})` }))
                            ]}
                        />
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
                    <label className="form-label">{t('date_time')}</label>
                    <Input type="datetime-local" value={date} onChange={e => handleDateChange(e.target.value)} required />
                    {isOutOfHours && (
                        <div className="appointment-form-modal__extra-badge appointment-form-modal__extra-badge--pulse">
                            <Icon name="WARNING" size="sm" /> {t('out_of_hours_appointment')}
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label className="form-label">{t('reason')}</label>
                    <Input type="textarea" rows="3" value={reason} onChange={e => handleReasonChange(e.target.value)} required />
                </div>

                <div className="input-group">
                    <label className="form-label">{t('institution')}</label>
                    <Select
                        value={selectedInstitution}
                        onChange={e => handleInstitutionChange(e.target.value)}
                        options={[
                            {
                                value: '',
                                label: selectedPatientData ? `${t('patient_institution')} (${selectedPatientData.institution_name || t('none')})` : t('patient_institution')
                            },
                            { value: 'none', label: t('particular_no_institution') },
                            ...institutions.map(inst => ({ value: inst.id, label: inst.name }))
                        ]}
                    />
                </div>

                <div className="input-group checkbox-group">
                    <Switch
                        id="bonified"
                        checked={bonified}
                        onChange={handleBonifiedChange}
                        label={t('bonified')}
                    />
                </div>

                <div className="form-actions">
                    <Button 
                        type="submit" 
                        variant="accent" 
                        className="form-actions__submit"
                    >
                        {editModeId ? t('save_changes') : t('confirm_booking')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentFormModal;

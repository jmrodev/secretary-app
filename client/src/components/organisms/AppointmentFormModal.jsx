import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import PatientSearchSelect from '../molecules/PatientSearchSelect';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const AppointmentFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    selectedDoctor,
    setSelectedDoctor,
    doctors,
    type,
    setType,
    selectedPatient,
    setSelectedPatient,
    selectedPatientData,
    setSelectedPatientData,
    date,
    setDate,
    reason,
    setReason,
    bonified,
    setBonified,
    selectedInstitution,
    setSelectedInstitution,
    institutions,
    syncReferenceInfo,
    onOpenEditPatient,
    missingData,
    editModeId
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editModeId ? (t('edit_appointment') || 'Editar Turno') : t('new_appointment')}
        >
            <form onSubmit={onSubmit} id="new-appointment-form" autoComplete="off">
                {/* Fake fields to stop Chrome Autosave */}
                <div className="visually-hidden">
                    <input type="text" name="fake_user_trap_appt" autoComplete="username" tabIndex={-1} />
                    <input type="password" name="fake_pass_trap_appt" autoComplete="new-password" tabIndex={-1} />
                </div>
                {syncReferenceInfo && (
                    <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-top-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">📄 Información Original (Referencia)</span>
                        <div className="text-sm font-bold text-amber-900 leading-tight">
                            {syncReferenceInfo}
                        </div>
                        <p className="text-[11px] text-amber-700 italic">
                            Utilice esta información para buscar al paciente correcto.
                        </p>
                    </div>
                )}
                <div className="input-group">
                    <label className="form-label">{t('doctors')}</label>
                    {user.role === 'doctor' ? (
                        <div className="form-control bg-gray-50 text-gray-500 cursor-not-allowed">
                            {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'You'}
                        </div>
                    ) : (
                        <select className="form-control" value={selectedDoctor || ''} onChange={e => setSelectedDoctor(e.target.value)} required>
                            <option value="">{t('select_doctor')}</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="input-group">
                    <label className="form-label">Tipo de Turno</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className={`btn btn-sm ${type === 'consultation' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setType('consultation')}
                        >
                            🏢 Presencial
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${type === 'virtual' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setType('virtual')}
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
                                setSelectedPatientData({ full_name: name });
                                onOpenEditPatient();
                            }}
                            onChange={(val, obj) => {
                                setSelectedPatient(val);
                                setSelectedPatientData(obj);
                            }}
                        />
                        {missingData.length > 0 && (
                            <div className="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded border border-yellow-200 flex justify-between items-center">
                                <span>
                                    ⚠️ <strong>Datos incompletos:</strong> {missingData.join(', ')}.
                                </span>
                                <button
                                    type="button"
                                    className="ml-2 text-blue-600 underline font-bold"
                                    onClick={onOpenEditPatient}
                                >
                                    Completar
                                </button>
                            </div>
                        )}

                        {selectedPatient && (
                            <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                                <div className="flex flex-col flex-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">📱 {t('phone') || 'Teléfono'}</span>
                                    <input
                                        type="text"
                                        className="text-sm font-bold text-emerald-900 bg-transparent border-b border-emerald-200 focus:border-emerald-500 focus:outline-none w-full py-0.5"
                                        value={selectedPatientData?.phone || ''}
                                        onChange={e => setSelectedPatientData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder={t('no_phone') || 'Sin teléfono'}
                                    />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-white px-2 py-1 rounded-full shadow-sm ml-2 shrink-0">
                                    <span className={`w-1.5 h-1.5 rounded-full ${selectedPatientData?.phone ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                    {selectedPatientData?.phone ? 'WHATSAPP OK' : 'SIN TEL.'}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="input-group">
                    <label className="form-label">{t('date_time')}</label>
                    <input type="datetime-local" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
                </div>



                <div className="input-group">
                    <label className="form-label">{t('reason')}</label>
                    <textarea className="form-control" rows="3" value={reason} onChange={e => setReason(e.target.value)} required></textarea>
                </div>

                <div className="input-group">
                    <label className="form-label">{t('institution') || 'Institución'}</label>
                    <select
                        className="form-control"
                        value={selectedInstitution}
                        onChange={e => setSelectedInstitution(e.target.value)}
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
                        onChange={e => setBonified(e.target.checked)}
                        className="w-auto"
                    />
                    <label htmlFor="bonified" className="input-label checkbox-label">
                        {t('bonificado') || 'Bonificado (Free/Waived)'}
                    </label>
                </div>
                <div className="mt-4 text-right">
                    <button
                        type="submit"
                        className="btn btn-accent w-full flex items-center justify-center gap-2"
                    >
                        {editModeId ? (t('save_changes') || 'Guardar Cambios') : t('confirm_booking')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentFormModal;

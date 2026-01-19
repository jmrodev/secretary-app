import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import api from '../api/axios';
import PatientSearchSelect from './PatientSearchSelect';
import MedicationAutocomplete from './MedicationAutocomplete';

const MedicalRequestForm = ({ doctors, onRequestCreated }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const [reqType, setReqType] = useState('prescription');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [reqNote, setReqNote] = useState('');
    const [bonified, setBonified] = useState(false);
    const [sendToDoctor, setSendToDoctor] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (selectedDoctor) {
            localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        }
    }, [selectedDoctor]);

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Basic validation
        if (!selectedPatient) {
            showMessage(t('select_patient') || 'Seleccione un paciente', 'error');
            return;
        }
        if (user.role !== 'doctor' && !selectedDoctor) {
            showMessage(t('select_doctor') || 'Seleccione un doctor', 'error');
            return;
        }
        if (!reqNote) {
            showMessage(t('fill_required_fields') || 'Complete los campos requeridos', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patient_id: selectedPatient,
                doctor_id: user.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
                request_note: reqNote,
                bonified,
                status: sendToDoctor ? 'pending' : 'completed'
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');

            // Reset form
            setReqNote('');
            setBonified(false);
            setSendToDoctor(true);
            setSelectedPatient('');
            setPatientData(null);

            if (onRequestCreated) onRequestCreated();
        } catch (err) {
            const errorMsg = err.response?.data || err.message || t('request_failed');
            showMessage(`${t('request_failed')}: ${errorMsg}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (user.role !== 'secretary' && user.role !== 'doctor') return null;

    return (
        <div className="card">
            <h3>{t('new_request')}</h3>
            <form onSubmit={handleCreateRequest}>
                <div className="input-group">
                    <label className="input-label">{t('request_type')}</label>
                    <select className="input-field" value={reqType} onChange={e => setReqType(e.target.value)}>
                        <option value="prescription">{t('prescription')}</option>
                        <option value="license">{t('medical_license')}</option>
                        <option value="certificate">{t('certificate') || 'Certificado'}</option>
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">{t('patient_label')}</label>
                    <PatientSearchSelect
                        value={selectedPatient}
                        onChange={(val, patient) => {
                            setSelectedPatient(val);
                            setPatientData(patient);
                        }}
                        placeholder={t('select_patient')}
                    />

                    {/* Overmedication Warning */}
                    {patientData && reqType === 'prescription' && patientData.next_suggested_prescription_date && new Date(patientData.next_suggested_prescription_date) > new Date() && (
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded mt-2 border border-yellow-200 text-sm flex items-start gap-2">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <strong>{t('possible_overmedication') || 'Posible Sobrefrecuencia'}:</strong><br />
                                {t('patient_has_valid_until') || 'Paciente tiene cobertura sugerida hasta'}: <b>{new Date(patientData.next_suggested_prescription_date).toLocaleDateString()}</b>
                            </div>
                        </div>
                    )}

                    {/* Active License Warning */}
                    {patientData && reqType === 'license' && patientData.license_expiry_date && new Date(patientData.license_expiry_date) > new Date() && (
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded mt-2 border border-yellow-200 text-sm flex items-start gap-2">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <strong>{t('active_license') || 'Licencia Vigente'}:</strong><br />
                                {t('license_valid_until') || 'Licencia válida hasta'}: <b>{new Date(patientData.license_expiry_date).toLocaleDateString()}</b>
                            </div>
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label className="input-label">{t('doctor_label')}</label>
                    {user.role === 'doctor' ? (
                        <div className="input-field input-read-only">
                            {user.name || 'Me'}
                        </div>
                    ) : (
                        <select className="input-field" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required>
                            <option value="">{t('select_doctor')}</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} - {d.specialty}</option>)}
                        </select>
                    )}
                </div>

                <div className="input-group">
                    <label className="input-label">{reqType === 'prescription' ? t('medication') : (reqType === 'license' ? t('diagnosis') : t('motive'))}</label>
                    {reqType === 'prescription' ? (
                        <MedicationAutocomplete
                            value={reqNote}
                            onChange={setReqNote}
                            placeholder={t('medication_placeholder') || "Ej: Ibuprofeno 600mg"}
                        />
                    ) : (
                        <textarea
                            className="input-field"
                            rows="3"
                            value={reqNote}
                            onChange={e => setReqNote(e.target.value)}
                            placeholder={reqType === 'license' ? t('diagnosis_placeholder') : t('certificate_placeholder')}
                            required
                        />
                    )}
                </div>

                <div className="input-group-row-center gap-2">
                    <input
                        type="checkbox"
                        id="req-bonified"
                        checked={bonified}
                        onChange={e => setBonified(e.target.checked)}
                        className="w-auto"
                    />
                    <label htmlFor="req-bonified" className="input-label mb-0 cursor-pointer">
                        {t('bonificado') || 'Bonificado (Free/Waived)'}
                    </label>
                </div>

                <div className="input-group-row-center gap-2 mb-4 p-2 bg-slate-50 rounded border border-slate-100">
                    <input
                        type="checkbox"
                        id="req-forward"
                        checked={sendToDoctor}
                        onChange={e => setSendToDoctor(e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="req-forward" className="input-label mb-0 cursor-pointer select-none font-medium text-main-700">
                        {t('send_to_doctor') || 'Enviar a revisión médica'}
                    </label>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (t('sending') || 'Enviando...') : t('send_request')}
                </button>
            </form>
        </div>
    );
};

export default MedicalRequestForm;

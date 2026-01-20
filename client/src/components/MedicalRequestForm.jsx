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
    const [patientMeds, setPatientMeds] = useState([]);
    const [medLoading, setMedLoading] = useState(false);
    const [medicationItems, setMedicationItems] = useState([]); // [NEW] List of meds
    const [tempMed, setTempMed] = useState(''); // [NEW] Current autocomplete text

    useEffect(() => {
        if (selectedDoctor) {
            localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        }
    }, [selectedDoctor]);

    useEffect(() => {
        if (selectedPatient && reqType === 'prescription') {
            fetchPatientMeds(selectedPatient);
        } else {
            setPatientMeds([]);
        }
    }, [selectedPatient, reqType]);

    const fetchPatientMeds = async (pid) => {
        setMedLoading(true);
        try {
            const res = await api.get(`/medical/patients/${pid}/medications`);
            setPatientMeds(res.data);
        } catch (err) {
            console.error("Error fetching patient meds", err);
        } finally {
            setMedLoading(false);
        }
    };

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

        const finalNote = reqType === 'prescription' ? medicationItems.join('\n') : reqNote;

        if (!finalNote) {
            showMessage(t('fill_required_fields') || 'Complete los campos requeridos', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patient_id: selectedPatient,
                doctor_id: user.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
                request_note: finalNote,
                bonified,
                status: sendToDoctor ? 'pending' : 'completed'
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');

            // Reset form
            setReqNote('');
            setMedicationItems([]);
            setTempMed('');
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
                        <>
                            <div className="flex gap-2 mb-2">
                                <div className="flex-1">
                                    <MedicationAutocomplete
                                        value={tempMed}
                                        onChange={setTempMed}
                                        placeholder={t('medication_placeholder') || "Ej: Ibuprofeno 600mg"}
                                        onSelectMedication={(med) => {
                                            setMedicationItems([...medicationItems, med.full_label]);
                                            setTempMed('');
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary px-3"
                                    onClick={() => {
                                        if (tempMed.trim()) {
                                            setMedicationItems([...medicationItems, tempMed.trim()]);
                                            setTempMed('');
                                        }
                                    }}
                                >
                                    +
                                </button>
                            </div>

                            {/* Medication List display */}
                            {medicationItems.length > 0 && (
                                <ul className="mb-4 bg-slate-50 rounded-lg border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                                    {medicationItems.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center p-2 text-sm text-slate-700">
                                            <span className="flex-1 mr-2">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => setMedicationItems(medicationItems.filter((_, i) => i !== idx))}
                                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {patientMeds.length > 0 && (
                                <div className="mt-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
                                        {t('patient_current_meds') || 'Medicación actual del paciente'}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {patientMeds.map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                                                onClick={() => {
                                                    const label = `${m.medication_name} ${m.dose} (${m.frequency})`;
                                                    if (!medicationItems.includes(label)) {
                                                        setMedicationItems([...medicationItems, label]);
                                                    }
                                                }}
                                            >
                                                {m.medication_name} {m.dose}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
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


import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';
import api from '../../api/axios';
import PatientSearchSelect from '../molecules/PatientSearchSelect';
import MedicationAutocomplete from '../molecules/MedicationAutocomplete';
import Button from '../atoms/Button';
import Card from '../atoms/Card';

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
    const [medicationItems, setMedicationItems] = useState([]);
    const [tempMed, setTempMed] = useState('');

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
        try {
            const res = await api.get(`/medical/patients/${pid}/medications`);
            setPatientMeds(res.data);
        } catch (err) {
            console.error("Error fetching patient meds", err);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

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
        <Card title={t('new_request')} className="animate-fadeIn">
            <form onSubmit={handleCreateRequest} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-group">
                        <label className="input-label">{t('request_type')}</label>
                        <select className="input-field" value={reqType} onChange={e => setReqType(e.target.value)}>
                            <option value="prescription">{t('prescription')}</option>
                            <option value="license">{t('medical_license')}</option>
                            <option value="certificate">{t('certificate') || 'Certificado'}</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('doctor_label')}</label>
                        {user.role === 'doctor' ? (
                            <div className="input-field bg-slate-50 text-main-500 font-medium">
                                Dr. {user.full_name || user.username}
                            </div>
                        ) : (
                            <select className="input-field" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required>
                                <option value="">{t('select_doctor')}</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} - {d.specialty}</option>)}
                            </select>
                        )}
                    </div>
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

                    {patientData && reqType === 'prescription' && patientData.next_suggested_prescription_date && new Date(patientData.next_suggested_prescription_date) > new Date() && (
                        <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 animate-fadeIn">
                            <span className="text-lg leading-none">⚠️</span>
                            <div>
                                <strong className="block mb-1">{t('possible_overmedication') || 'Posible Sobrefrecuencia'}</strong>
                                {t('patient_has_valid_until') || 'Paciente tiene cobertura sugerida hasta'}: <b>{new Date(patientData.next_suggested_prescription_date).toLocaleDateString()}</b>
                            </div>
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label className="input-label">
                        {reqType === 'prescription' ? t('medication') : (reqType === 'license' ? t('diagnosis') : t('motive'))}
                    </label>
                    {reqType === 'prescription' ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <MedicationAutocomplete
                                        value={tempMed}
                                        onChange={setTempMed}
                                        placeholder={t('medication_placeholder') || "Ej: Ibuprofeno 600mg"}
                                        onSelectMedication={(med) => {
                                            if (!medicationItems.includes(med.full_label)) {
                                                setMedicationItems([...medicationItems, med.full_label]);
                                            }
                                            setTempMed('');
                                        }}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        if (tempMed.trim() && !medicationItems.includes(tempMed.trim())) {
                                            setMedicationItems([...medicationItems, tempMed.trim()]);
                                            setTempMed('');
                                        }
                                    }}
                                >
                                    +
                                </Button>
                            </div>

                            {medicationItems.length > 0 && (
                                <ul className="flex flex-col gap-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100 max-h-40 overflow-y-auto">
                                    {medicationItems.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center px-3 py-2 bg-white rounded-lg border border-slate-100 text-sm shadow-sm animate-fadeIn">
                                            <span className="font-medium text-main-700">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => setMedicationItems(medicationItems.filter((_, i) => i !== idx))}
                                                className="text-red-400 hover:text-red-600 p-1"
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {patientMeds.length > 0 && (
                                <div className="mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                                        {t('patient_current_meds') || 'Medicación actual'}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {patientMeds.map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 hover:bg-blue-100 transition-all"
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
                        </div>
                    ) : (
                        <textarea
                            className="input-field min-h-[100px]"
                            value={reqNote}
                            onChange={e => setReqNote(e.target.value)}
                            placeholder={reqType === 'license' ? t('diagnosis_placeholder') : t('certificate_placeholder')}
                            required
                        />
                    )}
                </div>

                <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="req-bonified"
                            checked={bonified}
                            onChange={e => setBonified(e.target.checked)}
                            className="w-4 h-4 cursor-pointer accent-blue-600"
                        />
                        <label htmlFor="req-bonified" className="text-sm font-semibold text-main-700 cursor-pointer select-none">
                            {t('bonificado') || 'Bonificado (Costo $0 para el paciente)'}
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="req-forward"
                            checked={sendToDoctor}
                            onChange={e => setSendToDoctor(e.target.checked)}
                            className="w-4 h-4 cursor-pointer accent-blue-600"
                        />
                        <label htmlFor="req-forward" className="text-sm font-semibold text-main-700 cursor-pointer select-none">
                            {t('send_to_doctor') || 'Enviar a revisión médica'}
                        </label>
                    </div>
                </div>

                <footer className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        className="w-full md:w-auto"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (t('sending') || 'Enviando...') : t('send_request')}
                    </Button>
                </footer>
            </form>
        </Card>
    );
};

export default MedicalRequestForm;

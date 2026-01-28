
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';
import api from '../../api/axios';
import PatientSearchSelect from '../molecules/PatientSearchSelect';
import MedicationAutocomplete from '../molecules/MedicationAutocomplete';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import FormGroup from '../molecules/FormGroup';
import Input from '../atoms/Input';
import Select from '../atoms/Select';

const MedicalRequestForm = ({ doctors, onRequestCreated, initialType, initialSendToDoctor }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [patientMeds, setPatientMeds] = useState([]);
    const [reqType, setReqType] = useState(initialType || 'prescription');
    const [reqNote, setReqNote] = useState('');
    const [medicationItems, setMedicationItems] = useState([]);
    const [tempMed, setTempMed] = useState('');
    const [tempDose, setTempDose] = useState('');
    const [tempFreq, setTempFreq] = useState('');
    const [tempQty, setTempQty] = useState('');
    const [bonified, setBonified] = useState(false);
    const [sendToDoctor, setSendToDoctor] = useState(initialSendToDoctor !== undefined ? initialSendToDoctor : true);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        // [FIX] Auto-include text currently in the input field if the user forgot to click "+"
        let finalItems = [...medicationItems];
        if (reqType === 'prescription' && tempMed && tempMed.trim()) {
            const newItem = {
                name: tempMed.trim(),
                dose: tempDose.trim(),
                frequency: tempFreq.trim(),
                quantity: tempQty.trim()
            };
            // Check if name already exists
            if (!finalItems.some(i => i.name === newItem.name)) {
                finalItems.push(newItem);
            }
        }

        // Create a string representation for the note (legacy support)
        const finalNoteItems = finalItems.map(i => {
            let str = i.name;
            if (i.dose) str += ` ${i.dose}`;
            if (i.frequency) str += ` (${i.frequency})`;
            if (i.quantity) str += ` [Qty: ${i.quantity}]`;
            return str;
        });

        const finalNote = reqType === 'prescription' ? finalNoteItems.join('\n') : reqNote;

        if (!finalNote && reqType !== 'prescription') {
            showMessage(t('fill_required_fields') || 'Complete los campos requeridos', 'error');
            return;
        }

        if (reqType === 'prescription' && finalItems.length === 0) {
            showMessage(t('fill_required_fields') || 'Debe agregar al menos un medicamento', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patient_id: selectedPatient,
                doctor_id: user.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
                request_note: finalNote,
                raw_medication_data: JSON.stringify(finalItems),
                bonified,
                payment_method: bonified ? null : paymentMethod,
                status: sendToDoctor ? 'pending' : 'completed'
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');

            setReqNote('');
            setMedicationItems([]);
            setTempMed('');
            setTempDose('');
            setTempFreq('');
            setTempQty('');
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
        <Card title={t('new_request')} className="animate-fadeIn shadow-lg border-slate-200">
            <form onSubmit={handleCreateRequest} className="medical-request-form flex flex-col gap-6">
                <div className="medical-request-form__row grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label={t('request_type')} required>
                        <Select
                            value={reqType}
                            onChange={e => setReqType(e.target.value)}
                            options={[
                                { value: 'prescription', label: t('prescription') },
                                { value: 'license', label: t('medical_license') },
                                { value: 'certificate', label: t('certificate') || 'Certificado' }
                            ]}
                        />
                    </FormGroup>

                    <FormGroup label={t('doctor_label')} required>
                        {user.role === 'doctor' ? (
                            <div className="input-field bg-slate-50 text-main-500 font-medium py-2 px-3 rounded-lg border border-slate-200">
                                Dr. {user.full_name || user.username}
                            </div>
                        ) : (
                            <Select
                                value={selectedDoctor}
                                onChange={e => setSelectedDoctor(e.target.value)}
                                required
                                options={[
                                    { value: '', label: t('select_doctor') },
                                    ...doctors.map(d => ({ value: d.id, label: `${d.full_name} - ${d.specialty}` }))
                                ]}
                            />
                        )}
                    </FormGroup>
                </div>

                <FormGroup label={t('patient_label')} required>
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
                </FormGroup>

                <FormGroup
                    label={reqType === 'prescription' ? t('medication') : (reqType === 'license' ? t('diagnosis') : t('motive'))}
                    required
                >
                    {reqType === 'prescription' ? (
                        <div className="flex flex-col gap-3">
                            {/* Input Row */}
                            <div className="flex flex-col md:flex-row gap-2 items-end">
                                <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-2 w-full">
                                    <div className="md:col-span-5">
                                        <MedicationAutocomplete
                                            value={tempMed}
                                            onChange={setTempMed}
                                            placeholder={t('medication_placeholder') || "Nombre (Ej: Ibuprofeno)"}
                                            onSelectMedication={(med) => {
                                                // Avoid adding directly, let user fill details
                                                // Just unpack name and maybe defaults if we had them
                                            }}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Input
                                            placeholder="Dosis"
                                            value={tempDose}
                                            onChange={e => setTempDose(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <Input
                                            placeholder="Frecuencia (Ej: c/8hs)"
                                            value={tempFreq}
                                            onChange={e => setTempFreq(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Input
                                            placeholder="Cant."
                                            type="number"
                                            value={tempQty}
                                            onChange={e => setTempQty(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="h-[42px] px-4"
                                    onClick={() => {
                                        if (tempMed.trim()) {
                                            const newItem = {
                                                name: tempMed.trim(),
                                                dose: tempDose.trim(),
                                                frequency: tempFreq.trim(),
                                                quantity: tempQty.trim()
                                            };
                                            if (!medicationItems.some(i => i.name === newItem.name)) {
                                                setMedicationItems([...medicationItems, newItem]);
                                                setTempMed('');
                                                setTempDose('');
                                                setTempFreq('');
                                                setTempQty('');
                                            }
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
                                            <div className="flex gap-2 items-center">
                                                <span className="font-bold text-main-700">{item.name}</span>
                                                {item.dose && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{item.dose}</span>}
                                                {item.frequency && <span className="text-xs text-slate-500 italic">{item.frequency}</span>}
                                                {item.quantity && <span className="text-xs font-bold text-slate-700 border border-slate-200 px-1 rounded">x{item.quantity}</span>}
                                            </div>
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
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 hover:bg-blue-100 transition-all flex flex-col items-start gap-0.5"
                                                onClick={() => {
                                                    const newItem = {
                                                        name: m.medication_name,
                                                        dose: m.dose || '',
                                                        frequency: m.frequency || '',
                                                        quantity: '' // Default quantity clear
                                                    };
                                                    if (!medicationItems.some(i => i.name === newItem.name)) {
                                                        setMedicationItems([...medicationItems, newItem]);
                                                    }
                                                }}
                                            >
                                                <span>{m.medication_name} {m.dose}</span>
                                                <span className="text-[10px] opacity-70 font-normal">{m.frequency}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Input
                            type="textarea"
                            className="min-h-[100px]"
                            value={reqNote}
                            onChange={e => setReqNote(e.target.value)}
                            placeholder={reqType === 'license' ? t('diagnosis_placeholder') : t('certificate_placeholder')}
                            required
                        />
                    )}
                </FormGroup>

                <div className="flex flex-col gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-inner">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="req-bonified"
                            checked={bonified}
                            onChange={e => setBonified(e.target.checked)}
                            className="w-5 h-5 cursor-pointer accent-blue-600 transition-transform hover:scale-110"
                        />
                        <label htmlFor="req-bonified" className="text-sm font-bold text-main-800 cursor-pointer select-none">
                            {t('bonificado') || 'Bonificado (Costo $0 para el paciente)'}
                        </label>
                    </div>

                    {!bonified && (
                        <div className="ml-8 animate-fadeIn">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{t('payment_method') || 'Tipo de Pago'}</label>
                            <div className="flex flex-wrap gap-2">
                                {['cash', 'transfer', 'debit', 'credit', 'mercadopago'].map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setPaymentMethod(m)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                                    >
                                        {t(m) || m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="req-forward"
                            checked={sendToDoctor}
                            onChange={e => setSendToDoctor(e.target.checked)}
                            className="w-5 h-5 cursor-pointer accent-blue-600 transition-transform hover:scale-110"
                        />
                        <label htmlFor="req-forward" className="text-sm font-bold text-main-800 cursor-pointer select-none">
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

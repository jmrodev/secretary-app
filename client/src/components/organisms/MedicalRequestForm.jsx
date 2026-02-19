
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
import TabButton from '../atoms/TabButton';
import Icon from '../atoms/Icon';
import Badge from '../atoms/Badge';
import Tooltip from '../atoms/Tooltip';
import './MedicalRequestForm.css';

// Common frequency presets: label (display) + unitsPerDay (numeric)
const FREQ_PRESETS = [
    { label: '1/día', unitsPerDay: 1, text: 'cada 24hs' },
    { label: '2/día', unitsPerDay: 2, text: 'cada 12hs' },
    { label: '3/día', unitsPerDay: 3, text: 'cada 8hs' },
    { label: '4/día', unitsPerDay: 4, text: 'cada 6hs' },
    { label: '½/día', unitsPerDay: 0.5, text: 'cada 48hs' },
    { label: '¼/día', unitsPerDay: 0.25, text: '1/4 cada 24hs' },
    { label: '¾/día', unitsPerDay: 0.75, text: '3/4 cada 24hs' },
    { label: 'Según necesidad', unitsPerDay: null, text: 'según necesidad' },
];

/**
 * MedicalRequestForm Organism.
 * Form to create new medical requests (prescriptions, licenses, certificates).
 */
const MedicalRequestForm = ({ doctors, onRequestCreated, initialType, initialSendToDoctor }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();

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
    const [tempQty, setTempQty] = useState(''); // this will be boxes count
    const [tempUnitsPerBox, setTempUnitsPerBox] = useState('');
    const [tempDailyUnits, setTempDailyUnits] = useState('');
    const [tempFreqPreset, setTempFreqPreset] = useState(null);
    const [currentVademecumId, setCurrentVademecumId] = useState(null);
    const [sendToDoctor, setSendToDoctor] = useState(initialSendToDoctor !== undefined ? initialSendToDoctor : true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Live days-supply calculation
    const daysSupply = React.useMemo(() => {
        const upb = parseFloat(tempUnitsPerBox);
        const boxes = parseFloat(tempQty);
        const daily = parseFloat(tempDailyUnits);
        if (!upb || !boxes || !daily || daily <= 0) return null;
        return Math.floor((upb * boxes) / daily);
    }, [tempUnitsPerBox, tempQty, tempDailyUnits]);

    const refillDateStr = React.useMemo(() => {
        if (!daysSupply) return null;
        const d = new Date();
        d.setDate(d.getDate() + daysSupply);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    }, [daysSupply]);

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

    const handleSelectHabitual = (med) => {
        const medName = med.medication_name || med.name;
        setTempMed(medName);
        setTempDose(med.dose || '');
        setCurrentVademecumId(med.vademecum_id || med.id);

        // Auto-fill numeric values from history
        if (med.units_per_box) setTempUnitsPerBox(String(med.units_per_box));

        // Handle daily units / daily intake (backend uses daily_intake)
        const dailyVal = med.daily_units || med.daily_intake;
        if (dailyVal) {
            const sVal = String(dailyVal);
            setTempDailyUnits(sVal);
            // Auto-generate frequency text
            const num = parseFloat(sVal);
            let fStr = `${sVal} por día`;
            if (num === 1) fStr = 'cada 24hs';
            else if (num === 2) fStr = 'cada 12hs';
            else if (num === 3) fStr = 'cada 8hs';
            else if (num === 4) fStr = 'cada 6hs';
            else if (num === 0.5) fStr = 'día por medio';
            setTempFreq(fStr);
        }

        if (med.boxes_count) setTempQty(String(med.boxes_count));
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

        let finalItems = [...medicationItems];
        if (reqType === 'prescription' && tempMed && tempMed.trim()) {
            const newItem = {
                name: tempMed.trim(),
                dose: tempDose.trim(),
                frequency: tempFreq.trim(),
                quantity: tempQty.trim(),
                units_per_box: parseFloat(tempUnitsPerBox) || null,
                daily_units: parseFloat(tempDailyUnits) || null,
                days_supply: daysSupply,
                vademecum_id: currentVademecumId
            };
            if (!finalItems.some(i => i.name === newItem.name)) {
                finalItems.push(newItem);
            }
        }

        const finalNoteItems = finalItems.map(i => {
            let str = i.name;
            if (i.dose) str += ` ${i.dose}`;
            if (i.frequency) str += ` (${i.frequency})`;
            if (i.quantity) str += ` [Qty: ${i.quantity}]`;
            if (i.days_supply) str += ` (~${i.days_supply}d)`;
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
                status: sendToDoctor ? 'pending' : 'completed'
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');

            setReqNote('');
            setMedicationItems([]);
            setTempMed('');
            setTempDose('');
            setTempFreq('');
            setTempQty('');
            setTempUnitsPerBox('');
            setTempDailyUnits('');
            setTempFreqPreset(null);
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

    const baseClass = 'medical-request-form';

    return (
        <Card title={t('new_request')} className="medical-request-card">
            <form onSubmit={handleCreateRequest} className={baseClass}>
                <div className={`${baseClass}__row ${baseClass}__row--2`}>
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
                            <div className={`${baseClass}__readonly-value`}>
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
                        selectedData={patientData}
                        onChange={(val, patient) => {
                            setSelectedPatient(val);
                            setPatientData(patient);
                        }}
                        placeholder={t('select_patient')}
                    />

                    {patientData && reqType === 'prescription' && patientData.next_suggested_prescription_date && new Date(patientData.next_suggested_prescription_date) > new Date() && (
                        <div className={`${baseClass}__badge-wrapper`}>
                            <Badge variant="warning">
                                <Icon name="warning" size="1rem" />
                                {t('patient_has_valid_until') || 'Cobertura sugerida hasta'}: {new Date(patientData.next_suggested_prescription_date).toLocaleDateString()}
                            </Badge>
                        </div>
                    )}
                </FormGroup>

                <FormGroup
                    label={reqType === 'prescription' ? t('medication') : (reqType === 'license' ? t('diagnosis') : t('motive'))}
                    required
                >
                    {reqType === 'prescription' ? (
                        <div className={`${baseClass}__medication-section`}>
                            {/* --- Habitual medications --- */}
                            {patientMeds.length > 0 && (
                                <div className={`${baseClass}__habitual`}>
                                    <label className={`${baseClass}__field-label`}>
                                        {t('habitual_meds') || 'Habituales'}:
                                    </label>
                                    <div className={`${baseClass}__habitual-grid`}>
                                        {patientMeds.map(m => {
                                            const isSelected = medicationItems.some(i => i.name === m.medication_name);
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    className={`${baseClass}__habitual-btn ${isSelected ? `${baseClass}__habitual-btn--active` : ''}`}
                                                    onClick={() => handleSelectHabitual(m)}
                                                >
                                                    <span className={`${baseClass}__habitual-name`}>{m.medication_name}</span>
                                                    {(m.dose || m.daily_intake || m.daily_units) && (
                                                        <span className={`${baseClass}__habitual-meta`}>
                                                            {m.dose} {m.dose && (m.daily_intake || m.daily_units) ? '·' : ''} {m.daily_intake || m.daily_units ? `${m.daily_intake || m.daily_units}/d` : ''}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className={`${baseClass}__med-input-row`}>
                                <div className={`${baseClass}__inputs-grid`}>
                                    <div className={`${baseClass}__field-wrapper`}>
                                        <label className={`${baseClass}__field-label`}>
                                            {t('medication')}
                                        </label>
                                        <MedicationAutocomplete
                                            value={tempMed}
                                            onChange={setTempMed}
                                            onSelectMedication={(med) => {
                                                setTempMed(med.name);
                                                setCurrentVademecumId(med.id);
                                            }}
                                            placeholder={t('medication_placeholder') || "Nombre del medicamento..."}
                                        />
                                    </div>

                                    <div className={`${baseClass}__field-group-row`}>
                                        <div className={`${baseClass}__field-wrapper`}>
                                            <label className={`${baseClass}__field-label`}>
                                                {t('dose')}
                                                <Tooltip text={t('dose_help') || "Concentración (ej: 500mg, 10mg/ml)"} />
                                            </label>
                                            <Input
                                                size="sm"
                                                placeholder={t('dose_placeholder') || "Dosis (ej: 500mg)"}
                                                value={tempDose}
                                                onChange={e => setTempDose(e.target.value)}
                                            />
                                        </div>

                                        <div className={`${baseClass}__field-wrapper`}>
                                            <label className={`${baseClass}__field-label`}>
                                                {t('frequency')}
                                                <Tooltip text={t('freq_help') || "Selecciona o escribe la frecuencia"} />
                                            </label>
                                            <div className={`${baseClass}__freq-presets`}>
                                                {FREQ_PRESETS.map((p, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className={`${baseClass}__freq-btn ${tempFreqPreset === idx ? `${baseClass}__freq-btn--active` : ''}`}
                                                        onClick={() => {
                                                            setTempFreqPreset(idx);
                                                            setTempFreq(p.text);
                                                            if (p.unitsPerDay !== null) setTempDailyUnits(String(p.unitsPerDay));
                                                        }}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`${baseClass}__field-group-row ${baseClass}__field-group-row--numeric`}>
                                        <div className={`${baseClass}__field-wrapper`}>
                                            <label className={`${baseClass}__field-label`}>
                                                {t('units_per_box') || 'Caja de (X) pastillas'}
                                            </label>
                                            <select
                                                className={`input input--sm ${baseClass}__select`}
                                                value={tempUnitsPerBox}
                                                onChange={e => setTempUnitsPerBox(e.target.value)}
                                            >
                                                <option value="">{t('select_option') || 'Sel.'}</option>
                                                {[10, 14, 20, 28, 30, 40, 50, 60, 100].map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className={`${baseClass}__field-wrapper`}>
                                            <label className={`${baseClass}__field-label`}>
                                                {t('daily_units') || 'Pastillas por día'}
                                            </label>
                                            <select
                                                className={`input input--sm ${baseClass}__select`}
                                                value={tempDailyUnits}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setTempDailyUnits(val);
                                                    setTempFreqPreset(null);
                                                    // Auto-generate frequency text
                                                    if (val) {
                                                        const num = parseFloat(val);
                                                        let fStr = `${val} por día`;
                                                        if (num === 1) fStr = 'cada 24hs';
                                                        else if (num === 2) fStr = 'cada 12hs';
                                                        else if (num === 3) fStr = 'cada 8hs';
                                                        else if (num === 4) fStr = 'cada 6hs';
                                                        else if (num === 0.5) fStr = 'día por medio';
                                                        setTempFreq(fStr);
                                                    }
                                                }}
                                            >
                                                <option value="">{t('select_option') || 'Sel.'}</option>
                                                {[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].map(v => (
                                                    <option key={v} value={v}>
                                                        {v === 0.25 ? '1/4' : v === 0.5 ? '1/2' : v === 0.75 ? '3/4' : v}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className={`${baseClass}__field-wrapper`}>
                                            <label className={`${baseClass}__field-label`}>
                                                {t('quantity') || 'Cantidad de cajas'}
                                            </label>
                                            <Input
                                                size="sm"
                                                type="number"
                                                min="1"
                                                placeholder="1"
                                                value={tempQty}
                                                onChange={e => setTempQty(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {daysSupply !== null && (
                                        <div className={`${baseClass}__supply-preview animate-fadeIn`}>
                                            <Icon name="notifications" size="1.1rem" />
                                            <div className={`${baseClass}__supply-text`}>
                                                {t('supply_prefix') || 'Abastece'} <strong>~{daysSupply} {t('days') || 'días'}</strong>
                                                {refillDateStr && (
                                                    <span className={`${baseClass}__refill-date`}>
                                                        {' '}· {t('automatic_reminder') || 'Sugerido'}: <strong>{refillDateStr}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => {
                                        if (!tempMed.trim()) return;
                                        const newItem = {
                                            name: tempMed.trim(),
                                            dose: tempDose.trim(),
                                            frequency: tempFreq.trim(),
                                            quantity: tempQty.trim(),
                                            units_per_box: parseFloat(tempUnitsPerBox) || null,
                                            daily_units: parseFloat(tempDailyUnits) || null,
                                            days_supply: daysSupply,
                                            vademecum_id: currentVademecumId
                                        };
                                        if (!medicationItems.some(i => i.name === newItem.name)) {
                                            setMedicationItems([...medicationItems, newItem]);
                                            setTempMed('');
                                            setTempDose('');
                                            setTempFreq('');
                                            setTempQty('');
                                            setTempUnitsPerBox('');
                                            setTempDailyUnits('');
                                            setTempFreqPreset(null);
                                            setCurrentVademecumId(null);
                                        }
                                    }}
                                    icon={<Icon name="add" />}
                                />
                            </div>

                            {medicationItems.length > 0 && (
                                <ul className={`${baseClass}__med-list animate-fadeIn`}>
                                    {medicationItems.map((item, idx) => (
                                        <li key={idx} className={`${baseClass}__med-item`}>
                                            <div className={`${baseClass}__med-info`}>
                                                <span className={`${baseClass}__med-name`}>{item.name}</span>
                                                {item.dose && <span className={`${baseClass}__med-dose`}>{item.dose}</span>}
                                                {item.frequency && <span className={`${baseClass}__med-freq`}>{item.frequency}</span>}
                                                {item.quantity && <span className={`${baseClass}__med-qty`}>x{item.quantity}</span>}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => setMedicationItems(medicationItems.filter((_, i) => i !== idx))}
                                                icon={<Icon name="close" size="1rem" className="text-danger" />}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}

                        </div>
                    ) : (
                        <Input
                            type="textarea"
                            className={`${baseClass}__textarea`}
                            value={reqNote}
                            onChange={e => setReqNote(e.target.value)}
                            placeholder={reqType === 'license' ? t('diagnosis_placeholder') : t('certificate_placeholder')}
                            required
                        />
                    )}
                </FormGroup>

                <div className={`${baseClass}__panel`}>
                    <div className={`${baseClass}__panel-item`}>
                        <input
                            type="checkbox"
                            className={`${baseClass}__checkbox`}
                            id="req-forward"
                            checked={sendToDoctor}
                            onChange={e => setSendToDoctor(e.target.checked)}
                        />
                        <label htmlFor="req-forward" className={`${baseClass}__panel-label`}>
                            {t('send_to_doctor') || 'Enviar a revisión médica'}
                        </label>
                    </div>
                </div>

                <footer className={`${baseClass}__footer`}>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        variant="primary"
                        icon={<Icon name="send" />}
                    >
                        {isSubmitting ? (t('sending') || 'Enviando...') : t('send_request')}
                    </Button>
                </footer>
            </form>
        </Card>
    );
};

export default MedicalRequestForm;

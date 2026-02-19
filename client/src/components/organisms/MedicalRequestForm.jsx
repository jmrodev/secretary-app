
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
    const [tempQty, setTempQty] = useState('');
    const [currentVademecumId, setCurrentVademecumId] = useState(null);
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

        let finalItems = [...medicationItems];
        if (reqType === 'prescription' && tempMed && tempMed.trim()) {
            const newItem = {
                name: tempMed.trim(),
                dose: tempDose.trim(),
                frequency: tempFreq.trim(),
                quantity: tempQty.trim(),
                vademecum_id: currentVademecumId // I need to track this
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
                                                <Tooltip text={t('dose_help')} />
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
                                                <Tooltip text={t('freq_help')} />
                                            </label>
                                            <Input
                                                size="sm"
                                                placeholder={t('freq_placeholder') || "Frecuencia (ej: cada 8hs)"}
                                                value={tempFreq}
                                                onChange={e => setTempFreq(e.target.value)}
                                            />
                                        </div>

                                        <div className={`${baseClass}__field-wrapper`}>
                                            <label className={`${baseClass}__field-label`}>
                                                {t('quantity')}
                                                <Tooltip text={t('qty_help')} />
                                            </label>
                                            <Input
                                                size="sm"
                                                placeholder={t('qty_placeholder') || "Unidades/Cajas"}
                                                type="number"
                                                value={tempQty}
                                                onChange={e => setTempQty(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => {
                                        const newItem = {
                                            name: tempMed.trim(),
                                            dose: tempDose.trim(),
                                            frequency: tempFreq.trim(),
                                            quantity: tempQty.trim(),
                                            vademecum_id: currentVademecumId
                                        };
                                        if (!medicationItems.some(i => i.name === newItem.name)) {
                                            setMedicationItems([...medicationItems, newItem]);
                                            setTempMed('');
                                            setTempDose('');
                                            setTempFreq('');
                                            setTempQty('');
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

                            {patientMeds.length > 0 && (
                                <div className={`${baseClass}__habitual-section`}>
                                    <span className={`${baseClass}__habitual-label`}>
                                        {t('patient_current_meds') || 'Medicación actual'}
                                    </span>
                                    <div className={`${baseClass}__habitual-grid`}>
                                        {patientMeds.map(m => {
                                            const isSelected = medicationItems.some(i => i.name === m.medication_name);
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    className={`${baseClass}__habitual-btn ${isSelected ? `${baseClass}__habitual-btn--active` : ''}`}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setMedicationItems(medicationItems.filter(i => i.name !== m.medication_name));
                                                        } else {
                                                            const newItem = {
                                                                name: m.medication_name,
                                                                dose: m.dose || '',
                                                                frequency: m.frequency || '',
                                                                quantity: '',
                                                                vademecum_id: m.vademecum_id
                                                            };
                                                            setMedicationItems([...medicationItems, newItem]);
                                                        }
                                                    }}
                                                >
                                                    <span className={`${baseClass}__habitual-name`}>{m.medication_name} {m.dose}</span>
                                                    <span className={`${baseClass}__habitual-meta`}>{m.frequency}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
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

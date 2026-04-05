
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

/**
 * useMedicalRequest Hook (Feature-based).
 * Centralizes logic for creating medical requests (prescriptions, licenses, certificates).
 */
export const useMedicalRequest = (initialType, initialSendToDoctor, user, showMessage, t, onRequestCreated) => {
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [patientMeds, setPatientMeds] = useState([]);
    const [reqType, setReqType] = useState(initialType || 'prescription');
    const [reqNote, setReqNote] = useState('');
    const [medicationItems, setMedicationItems] = useState([]);
    const [sendToDoctor, setSendToDoctor] = useState(initialSendToDoctor !== undefined ? initialSendToDoctor : true);
    const [bonified, setBonified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Temporary medication states (for auto-add on submit)
    const [tempMed, setTempMed] = useState('');
    const [tempDose, setTempDose] = useState('');
    const [tempFreq, setTempFreq] = useState('');
    const [tempDailyUnits, setTempDailyUnits] = useState('');
    const [tempUnitsPerBox, setTempUnitsPerBox] = useState('');
    const [tempQty, setTempQty] = useState('');
    const [tempVademecumId, setTempVademecumId] = useState(null);

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

    const handleCreateRequest = async (e, initialItems = [], initialNote = '') => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        if (!selectedPatient) {
            showMessage(t('select_patient') || 'Seleccione un paciente', 'error');
            return;
        }
        if (user?.role !== 'doctor' && !selectedDoctor) {
            showMessage(t('select_doctor') || 'Seleccione un doctor', 'error');
            return;
        }

        let finalItems = [...initialItems];

        // Automatic inclusion of current form data if name is present
        if (reqType === 'prescription' && tempMed.trim()) {
            const newItem = {
                name: tempMed.trim(),
                dose: tempDose.trim(),
                frequency: tempFreq.trim(),
                quantity: tempQty.trim() || "1",
                units_per_box: parseFloat(tempUnitsPerBox) || null,
                daily_units: parseFloat(tempDailyUnits) || null,
                vademecum_id: tempVademecumId
            };
            if (!finalItems.some(i => i.name === newItem.name)) {
                finalItems.push(newItem);
            }
        }

        if (reqType === 'prescription' && finalItems.length === 0) {
            showMessage(t('fill_required_fields') || 'Complete los campos requeridos (Nombre del medicamento)', 'error');
            return;
        }

        if (!initialNote && reqType !== 'prescription') {
            showMessage(t('fill_required_fields') || 'Complete los campos requeridos', 'error');
            return;
        }

        let finalNote = initialNote;
        if (reqType === 'prescription') {
            finalNote = finalItems.map(i => {
                let str = i.name;
                if (i.dose) str += ` ${i.dose}`;
                if (i.frequency) str += ` (${i.frequency})`;
                if (i.quantity && i.quantity !== '0') {
                    const label = parseInt(i.quantity) === 1 ? (t('box') || 'caja') : (t('boxes_plural') || 'cajas');
                    str += ` - ${i.quantity} ${label}`;
                }
                if (i.days_supply) str += ` (~${i.days_supply}d)`;
                return str.replace(/\s+/g, ' ').trim();
            }).join('\n');
        }

        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patient_id: selectedPatient,
                doctor_id: user?.role === 'doctor' ? (user.user_id || user.id) : selectedDoctor,
                request_note: finalNote,
                raw_medication_data: JSON.stringify(finalItems),
                status: sendToDoctor ? 'pending' : 'completed',
                bonified: bonified
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');

            // Reset form
            setReqNote('');
            setMedicationItems([]);
            setSendToDoctor(true);
            setBonified(false);
            setSelectedPatient('');
            setPatientData(null);

            // Reset temp fields
            setTempMed('');
            setTempDose('');
            setTempFreq('');
            setTempDailyUnits('');
            setTempUnitsPerBox('');
            setTempQty('');
            setTempVademecumId(null);

            if (onRequestCreated) onRequestCreated();
        } catch (err) {
            const errorMsg = err.response?.data || err.message || t('request_failed');
            showMessage(`${t('request_failed')}: ${errorMsg}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        selectedDoctor, setSelectedDoctor,
        selectedPatient, setSelectedPatient,
        patientData, setPatientData,
        patientMeds,
        reqType, setReqType,
        reqNote, setReqNote,
        medicationItems, setMedicationItems,
        sendToDoctor, setSendToDoctor,
        bonified, setBonified,
        isSubmitting,
        handleCreateRequest,
        tempMedsProps: {
            tempMed, setTempMed,
            tempDose, setTempDose,
            tempFreq, setTempFreq,
            tempDailyUnits, setTempDailyUnits,
            tempUnitsPerBox, setTempUnitsPerBox,
            tempQty, setTempQty,
            tempVademecumId, setTempVademecumId
        }
    };
};

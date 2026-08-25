import { useState, useMemo } from 'react';
import { api } from '@/api/axios';
import { useFetch } from '@/hooks/useFetch';
import { useDoctors } from '@/context/DoctorContextDefinition';

/**
 * ECC-Pattern: useMedicalRequest Hook
 */
export const useMedicalRequest = (initialType, initialSendToDoctor, user, showMessage, t, onRequestCreated) => {
    const { doctors, viewDoctorId } = useDoctors();
    
    // ECC: Derive doctor directly from context (always in sync with Top Bar)
    const selectedDoctor = useMemo(() => {
        return viewDoctorId || (doctors.length > 0 ? String(doctors[0].id) : '');
    }, [viewDoctorId, doctors]);

    const [selectedPatient, setSelectedPatient] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [reqType, setReqType] = useState(initialType || 'prescription');
    const [reqNote, setReqNote] = useState('');
    const [medicationItems, setMedicationItems] = useState([]);
    const [sendToDoctor, setSendToDoctor] = useState(initialSendToDoctor !== undefined ? initialSendToDoctor : true);
    const [bonified, setBonified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Data Fetching ---
    const { data: patientMedsResponse } = useFetch(selectedPatient && reqType === 'prescription' ? `/medical/patients/${selectedPatient}/medications` : null, {
        initialData: { success: true, data: [] }
    });
    const patientMeds = useMemo(() => patientMedsResponse?.data || [], [patientMedsResponse]);

    // Temporary medication states
    const [tempMed, setTempMed] = useState('');
    const [tempDose, setTempDose] = useState('');
    const [tempFreq, setTempFreq] = useState('');
    const [tempDailyUnits, setTempDailyUnits] = useState('');
    const [tempUnitsPerBox, setTempUnitsPerBox] = useState('');
    const [tempQty, setTempQty] = useState('');
    const [tempVademecumId, setTempVademecumId] = useState(null);

    const handleCreateRequest = async (e, initialItems = [], initialNote = '') => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        if (!selectedPatient) return showMessage(t('select_patient'), 'error');
        
        // Use derived selectedDoctor
        if (user?.role !== 'doctor' && !selectedDoctor) return showMessage(t('select_doctor'), 'error');

        let finalItems = [...initialItems];
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
            if (!finalItems.some(i => i.name === newItem.name)) finalItems.push(newItem);
        }

        if (reqType === 'prescription' && finalItems.length === 0) return showMessage(t('fill_required_fields'), 'error');
        if (!initialNote && reqType !== 'prescription') return showMessage(t('fill_required_fields'), 'error');

        let finalNote = initialNote;
        if (reqType === 'prescription') {
            finalNote = finalItems.map(i => {
                let str = i.name;
                if (i.dose) str += ` ${i.dose}`;
                if (i.frequency) str += ` (${i.frequency})`;
                if (i.quantity && i.quantity !== '0') {
                    const label = parseInt(i.quantity) === 1 ? (t('box')) : (t('boxes_plural'));
                    str += ` - ${i.quantity} ${label}`;
                }
                return str.trim();
            }).join('\n');
        }

        const currentDoc = user?.role === 'doctor' ? doctors.find(d => Number(d.user_id) === Number(user.user_id || user.id)) : null;
        const finalDoctorId = user?.role === 'doctor' ? (currentDoc?.id || user.user_id || user.id) : selectedDoctor;

        setIsSubmitting(true);
        try {
            await api.post('/medical/requests', {
                type: reqType,
                patientId: selectedPatient,
                doctor_id: finalDoctorId,
                request_note: finalNote,
                raw_medication_data: JSON.stringify(finalItems),
                status: sendToDoctor ? 'pending' : 'completed',
                bonified: bonified
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed')), 'success');

            setReqNote('');
            setMedicationItems([]);
            setSelectedPatient('');
            setPatientData(null);
            setTempMed('');
            if (onRequestCreated) onRequestCreated();
        } catch (err) {
            console.error("[useMedicalRequest] Error:", err);
            showMessage(t('request_failed'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        selectedDoctor,
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
            tempMed, setTempMed, tempDose, setTempDose, tempFreq, setTempFreq,
            tempDailyUnits, setTempDailyUnits, tempUnitsPerBox, setTempUnitsPerBox,
            tempQty, setTempQty, tempVademecumId, setTempVademecumId
        }
    };
};

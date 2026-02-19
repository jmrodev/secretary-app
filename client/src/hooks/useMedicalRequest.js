import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

export const useMedicalRequest = (initialType, initialSendToDoctor, user, showMessage, t, onRequestCreated) => {
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [patientMeds, setPatientMeds] = useState([]);
    const [reqType, setReqType] = useState(initialType || 'prescription');
    const [reqNote, setReqNote] = useState('');
    const [medicationItems, setMedicationItems] = useState([]);
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

    const handleCreateRequest = async (e, finalItems = [], finalNote = '') => {
        if (e) e.preventDefault();
        if (isSubmitting) return;

        if (!selectedPatient) {
            showMessage(t('select_patient') || 'Seleccione un paciente', 'error');
            return;
        }
        if (user.role !== 'doctor' && !selectedDoctor) {
            showMessage(t('select_doctor') || 'Seleccione un doctor', 'error');
            return;
        }

        if (reqType === 'prescription' && finalItems.length === 0) {
            showMessage(t('fill_required_fields') || 'Debe agregar al menos un medicamento', 'error');
            return;
        }

        if (!finalNote && reqType !== 'prescription') {
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
                raw_medication_data: JSON.stringify(finalItems),
                status: sendToDoctor ? 'pending' : 'completed'
            });
            showMessage(sendToDoctor ? t('request_sent') : (t('request_saved_completed') || 'Guardado como Completado'), 'success');

            // Reset form
            setReqNote('');
            setMedicationItems([]);
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

    return {
        selectedDoctor, setSelectedDoctor,
        selectedPatient, setSelectedPatient,
        patientData, setPatientData,
        patientMeds,
        reqType, setReqType,
        reqNote, setReqNote,
        medicationItems, setMedicationItems,
        sendToDoctor, setSendToDoctor,
        isSubmitting,
        handleCreateRequest
    };
};

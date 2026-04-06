import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useDashboardModals = () => {
    const navigate = useNavigate();

    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {}, apptId: null });

    const handleOpenPayment = (appt) => {
        setPaymentModal({
            open: true,
            initialData: {
                type: 'income_patient',
                amount: appt.cost || 0,
                patientId: appt.patient_id,
                patientName: appt.patient_name,
                patientDni: appt.patient_dni,
                patientUserId: appt.patient_user_id,
                doctorId: appt.doctor_id,
                description: `Payment for appointment on ${new Date(appt.appointment_date).toLocaleDateString()}`,
                apptId: appt.id
            },
            apptId: appt.id
        });
        setActionModal(prev => ({ ...prev, open: false }));
    };

    const handleOpenHistory = (appt) => {
        setHistoryModal({
            open: true,
            patientId: appt.patient_id,
            patientName: appt.patient_name
        });
        setActionModal(prev => ({ ...prev, open: false }));
    };

    const handleOpenPrescribe = (appt) => {
        setPrescribeModal({
            open: true,
            apptId: appt.id,
            patientName: appt.patient_name,
            medications: '',
            instructions: ''
        });
        setActionModal(prev => ({ ...prev, open: false }));
    };

    const handleOpenReschedule = (appt) => {
        navigate('/appointments', { state: { rescheduleAppt: appt } });
    };

    const handleOpenSync = (appt) => {
        navigate('/appointments', { state: { syncAppt: appt } });
    };

    const handleHardEdit = (appt) => {
        navigate('/appointments', { state: { editAppt: appt } });
    };

    return {
        actionModal, setActionModal,
        historyModal, setHistoryModal,
        prescribeModal, setPrescribeModal,
        paymentModal, setPaymentModal,
        handleOpenPayment,
        handleOpenHistory,
        handleOpenPrescribe,
        handleOpenReschedule,
        handleOpenSync,
        handleHardEdit,
        navigate
    };
};

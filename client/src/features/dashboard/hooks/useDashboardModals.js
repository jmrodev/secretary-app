import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/utils/core/dateUtils';

export const useDashboardModals = () => {
    const navigate = useNavigate();

    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {}, apptId: null });

    const handleOpenPayment = useCallback((appt) => {
        setPaymentModal({
            open: true,
            initialData: {
                type: 'income_patient',
                amount: appt.cost || 0,
                patientId: appt.patientId || appt.patient_id,
                patientName: appt.patient_name,
                patientDni: appt.patient_dni,
                patientUserId: appt.patient_user_id,
                doctorId: appt.doctor_id,
                description: `Payment for appointment on ${formatDate(appt.appointment_date)}`,
                apptId: appt.id
            },
            apptId: appt.id
        });
        setActionModal(prev => ({ ...prev, open: false }));
    }, []);

    const handleOpenHistory = useCallback((appt) => {
        setHistoryModal({
            open: true,
            patientId: appt.patientId || appt.patient_id,
            patientName: appt.patient_name
        });
        setActionModal(prev => ({ ...prev, open: false }));
    }, []);

    const handleOpenPrescribe = useCallback((appt) => {
        setPrescribeModal({
            open: true,
            apptId: appt.id,
            patientName: appt.patient_name,
            medications: '',
            instructions: ''
        });
        setActionModal(prev => ({ ...prev, open: false }));
    }, []);

    const handleOpenReschedule = useCallback((appt) => {
        navigate('/appointments', { state: { rescheduleAppt: appt } });
    }, [navigate]);

    const handleOpenSync = useCallback((appt) => {
        navigate('/appointments', { state: { syncAppt: appt } });
    }, [navigate]);

    const handleHardEdit = useCallback((appt) => {
        navigate('/appointments', { state: { editAppt: appt } });
    }, [navigate]);

    return useMemo(() => ({
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
    }), [
        actionModal, historyModal, prescribeModal, paymentModal,
        handleOpenPayment, handleOpenHistory, handleOpenPrescribe,
        handleOpenReschedule, handleOpenSync, handleHardEdit, navigate
    ]);
};

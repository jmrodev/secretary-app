import { useCallback } from 'react';

/**
 * Hook to handle UI-specific interactions within the agenda (opening modals, clicking slots).
 */
export const useAppointmentUIHandlers = ({
    selectedDate,
    setSelectedDate,
    setDate,
    setSelectedDoctor,
    setShowForm,
    setBonified: _setBonified,
    setSelectedInstitution: _setSelectedInstitution,
    setReason: _setReason,
    setSyncReferenceInfo: _setSyncReferenceInfo,
    setSyncingZombieId: _setSyncingZombieId,
    setActionModal,
    setPrescribeModal,
    setAuthModalOpen: _setAuthModalOpen,
    setRetryAction: _setRetryAction,
    setShowNextSlotModal: _setShowNextSlotModal,
    setWhatsappModal: _setWhatsappModal,
    setEditPatientModalOpen: _setEditPatientModalOpen,
    setPaymentModal,
    setHistoryModal,
    exitRescheduleMode,
    viewDoctorId,
    rescheduleAppt,
    holidays,
    user,
    confirm,
    showMessage,
    t,
    doctors: _doctors
}) => {
    const handleDateSelect = useCallback((date) => setSelectedDate(date), [setSelectedDate]);

    const handleSlotClick = useCallback(async (hour, existingAppt, minute = 0) => {
        if (rescheduleAppt) {
            if (existingAppt) return;
            const newDate = new Date(selectedDate);
            newDate.setHours(hour, minute, 0, 0);
            const offset = newDate.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);
            if (await confirm(t('confirm_reschedule_to').replace('{date}', new Date(localISOTime).toLocaleString()))) {
                exitRescheduleMode();
            }
            return;
        }

        if (existingAppt) {
            setActionModal({ open: true, appt: existingAppt });
        } else {
            const toLocalYMD = (d) => {
                const date = new Date(d);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            };
            const selectedYMD = toLocalYMD(selectedDate);
            const isHoliday = holidays.find(h => toLocalYMD(h.date) === selectedYMD);

            if (isHoliday) {
                showMessage(`Cannot book on ${selectedYMD}: ${isHoliday.description}`, 'error');
                return;
            }

            if (['patient', 'secretary', 'doctor', 'admin'].includes(user.role)) {
                const newDate = new Date(selectedDate);
                newDate.setHours(hour, minute, 0, 0);
                const offset = newDate.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);
                setDate(localISOTime);
                if (viewDoctorId) setSelectedDoctor(viewDoctorId);
                setShowForm(true);
            }
        }
    }, [rescheduleAppt, selectedDate, exitRescheduleMode, confirm, t, setActionModal, holidays, showMessage, user, viewDoctorId, setSelectedDoctor, setDate, setShowForm]);

    const handleOpenPayment = useCallback((appt) => {
        const remainingDebt = Math.max(0, (Number(appt.cost) || 0) - (Number(appt.paid_amount) || 0));
        const formatTime = (isoStr) => isoStr ? new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/I';
        const formatDate = (isoStr) => isoStr ? new Date(isoStr).toLocaleDateString() : '';

        const traceLog = [
            `--- BITÁCORA DEL TURNO ---`,
            `• Fecha Turno: ${formatDate(appt.appointment_date)} ${formatTime(appt.appointment_date)}`,
            appt.created_at ? `• Solicitado/Creado: ${formatDate(appt.created_at)} ${formatTime(appt.created_at)}` : null,
            appt.confirmed_at ? `• Confirmado: ${formatDate(appt.confirmed_at)} ${formatTime(appt.confirmed_at)}` : null,
            appt.arrived_at ? `• En Sala de Espera: ${formatTime(appt.arrived_at)} hs` : null,
            appt.completed_at ? `• Atendido: ${formatTime(appt.completed_at)} hs` : null,
            `--- TURNO ACTUAL ---`,
            `• Costo Turno: $${Number(appt.cost || 0).toLocaleString('es-AR')}`,
            `• Saldo Pendiente Turno: $${remainingDebt.toLocaleString('es-AR')}`
        ].filter(Boolean).join('\n');

        setPaymentModal({
            open: true,
            initialData: {
                type: 'income_patient',
                patientId: appt.patient_id,
                patientName: appt.patient_name || appt.full_name,
                amount: remainingDebt,
                description: traceLog,
                doctorId: appt.doctor_id,
                appointment_id: appt.id,
                related_user_id: appt.patient_user_id,
                patientUserId: appt.patient_user_id,
                appointmentType: appt.type,
                serviceType: appt.type === 'virtual' ? 'virtual_consultation' : 'consultation',
                appointment: appt
            }
        });
    }, [setPaymentModal]);

    const handleOpenHistory = useCallback((patientId, patientName) => {
        setHistoryModal({ open: true, patientId, patientName });
    }, [setHistoryModal]);

    const handleOpenPrescribe = useCallback((appt) => {
        setPrescribeModal({
            open: true,
            apptId: appt.id,
            patientName: appt.patient_name || appt.full_name,
            patientId: appt.patient_id,
            medications: '',
            instructions: ''
        });
    }, [setPrescribeModal]);

    return {
        handleDateSelect,
        handleSlotClick,
        handleOpenPayment,
        handleOpenHistory,
        handleOpenPrescribe
    };
};

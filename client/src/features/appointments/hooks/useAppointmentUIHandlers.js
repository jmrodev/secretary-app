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
        setPaymentModal({
            open: true,
            initialData: {
                type: 'income_patient',
                patientId: appt.patient_id,
                patientName: appt.patient_name || appt.full_name,
                amount: appt.cost,
                description: `Turno - ${appt.patient_name || appt.full_name} - ${appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString() : 'Sin Fecha'}`,
                doctorId: appt.doctor_id,
                appointment_id: appt.id,
                related_user_id: appt.patient_user_id,
                patientUserId: appt.patient_user_id
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

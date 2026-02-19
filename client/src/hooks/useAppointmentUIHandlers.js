import { useCallback } from 'react';

export const useAppointmentUIHandlers = ({
    selectedDate,
    setSelectedDate,
    setDate,
    setSelectedDoctor,
    setShowForm,
    setBonified,
    setSelectedInstitution,
    setReason,
    setSyncReferenceInfo,
    setSyncingZombieId,
    setActionModal,
    setPrescribeModal,
    setAuthModalOpen,
    setRetryAction,
    setShowNextSlotModal,
    setWhatsappModal,
    setEditPatientModalOpen,
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
    doctors
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
                // This will be handled by the parent component
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
    }, [
        rescheduleAppt, selectedDate, exitRescheduleMode, confirm, t,
        setActionModal, holidays, showMessage, user, viewDoctorId,
        setSelectedDoctor, setDate, setShowForm
    ]);

    const handleOpenPayment = useCallback((appt) => {
        setPaymentModal({
            open: true,
            initialData: {
                type: 'income_patient',
                patientId: appt.patient_id,
                patientName: appt.patient_name || appt.full_name,
                amount: appt.tariff,
                description: `Turno - ${appt.patient_name || appt.full_name} - ${appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString() : 'Sin Fecha'}`,
                doctorId: appt.doctor_id,
                appointment_id: appt.id,
                // Convertir patient_id a user_id para la tabla transactions
                related_user_id: appt.patient_user_id,
                patientUserId: appt.patient_user_id
            }
        });
    }, [setPaymentModal]);

    const handleOpenHistory = useCallback((patientId, patientName) => {
        setHistoryModal({
            open: true,
            patientId,
            patientName
        });
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

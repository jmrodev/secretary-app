import { useCallback, useMemo } from 'react';
import { api } from '@/api/axios';
import { parseDate, toInputDateTime, toInputDate, createDate, formatDate } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';

// Feature internal hooks
import { useAppointmentActions } from './useAppointmentActions';
import { useAppointmentUIHandlers } from './useAppointmentUIHandlers';

/**
 * High-level handlers for the appointments feature.
 * Coordinates UI, actions, and holiday handling.
 */
export const useAppointmentsHandlers = ({
    user, t, showMessage, confirm, prompt, navigate,
    selectedDate, setSelectedDate, viewDoctorId, setViewDoctorId, selectedDoctor, setSelectedDoctor,
    rescheduleAppt, holidays, appointments, filteredAppointments, doctors, settings,
    setDate, setShowForm, setBonified, setSelectedInstitution, setReason, setSyncReferenceInfo, setSyncingZombieId,
    setActionModal, setPrescribeModal, setAuthModalOpen, setRetryAction, setShowNextSlotModal, setWhatsappModal,
    setEditPatientModalOpen, setPaymentModal, setHistoryModal, setSelectedPatient: _setSelectedPatient, exitRescheduleMode,
    updateStatus, updateAppointment, fetchAppointments, savePrescription, deleteAppointment, rescheduleAppointment, bookAppointment,
    setIsOutOfHours, fetchNextFreeSlots, 
    selectedPatientData, copyToClipboard, booking, setSlotHistory
}) => {

    const appointmentActions = useAppointmentActions({
        user, t, showMessage, confirm, prompt, navigate,
        updateStatus, updateAppointment, deleteAppointment, rescheduleAppointment,
        bookAppointment, savePrescription, fetchAppointments, setActionModal
    });

    const uiHandlers = useAppointmentUIHandlers({
        selectedDate, setSelectedDate, setDate, setSelectedDoctor, setShowForm, setBonified, setSelectedInstitution,
        setReason, setSyncReferenceInfo, setSyncingZombieId, setActionModal, setPrescribeModal, setAuthModalOpen,
        setRetryAction, setShowNextSlotModal, setWhatsappModal, setEditPatientModalOpen, setPaymentModal, setHistoryModal,
        exitRescheduleMode, viewDoctorId, rescheduleAppt, holidays, user, confirm, showMessage, t, doctors
    });

    const handleDateSelect = useCallback((date) => setSelectedDate(date), [setSelectedDate]);

    const handleSlotClick = useCallback(async (hour, existingAppt, minute = 0) => {
        if (rescheduleAppt) {
            if (existingAppt) return;
            const selectedYMD = toInputDate(selectedDate);
            const isHoliday = holidays.find(h => toInputDate(h.date) === selectedYMD);

            if (isHoliday) {
                showMessage((t('cannot_reschedule_holiday')).replace('{description}', isHoliday.description), 'error');
                return;
            }

            const newDate = createDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, minute);
            const localISOTime = toInputDateTime(newDate);

            if (await confirm(t('confirm_reschedule_to').replace('{date}', formatDate(localISOTime, { time: true })))) {
                const result = await appointmentActions.handleReschedule(rescheduleAppt.id, localISOTime);
                if (result?.success) {
                    exitRescheduleMode();
                } else if (result?.type === 'AUTH_REQUIRED') {
                    setRetryAction({ type: 'reschedule', args: [rescheduleAppt.id, localISOTime] });
                    setAuthModalOpen(true);
                }
            }
            return;
        }

        if (existingAppt) {
            setActionModal({ open: true, appt: existingAppt });
        } else {
            const selectedYMD = toInputDate(selectedDate);
            const isHoliday = holidays.find(h => toInputDate(h.date) === selectedYMD);

            if (isHoliday) {
                showMessage((t('cannot_book_holiday')).replace('{description}', isHoliday.description), 'error');
                return;
            }

            if (['patient', 'secretary', 'doctor', 'admin'].includes(user?.role)) {
                const newDate = createDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, minute);
                const localISOTime = toInputDateTime(newDate);

                setDate(localISOTime);
                if (viewDoctorId) setSelectedDoctor(viewDoctorId);
                setShowForm(true);
                setIsOutOfHours(false);
                setBonified(false);
                setSelectedInstitution('');
            }
        }
    }, [rescheduleAppt, selectedDate, holidays, showMessage, t, confirm, appointmentActions,
        exitRescheduleMode, setRetryAction, setAuthModalOpen, setActionModal,
        setDate, setSelectedDoctor, viewDoctorId, setShowForm, setIsOutOfHours,
        setBonified, setSelectedInstitution, user]);

    const handleUpdateStatus = useCallback(async (id, status) => {
        await appointmentActions.handleStatusUpdate(id, status);
        fetchAppointments();
        try {
            const updated = await api.get(`/appointments/${id}`);
            if (updated?.data?.data) {
                const freshAppt = updated.data.data;
                setActionModal(prev => (prev.open && prev.appt && String(prev.appt.id) === String(id)) ? { ...prev, appt: freshAppt } : prev);
                return;
            }
        } catch (refreshErr) {
            // Best-effort refresh of the modal's appointment; ignore failures.
            console.error('Failed to refresh appointment modal after status update:', refreshErr);
        }
        setActionModal(prev => (prev.open && prev.appt && String(prev.appt.id) === String(id)) ? { ...prev, appt: { ...prev.appt, status } } : prev);
    }, [appointmentActions, fetchAppointments, setActionModal]);

    const handleSaveNote = async (apptId, note, date) => {
        try {
            await api.put(`/appointments/${apptId}`, { reason: note, appointment_date: date });
            showMessage(t('note_saved'), 'success');
            fetchAppointments();
        } catch (e) {
            console.error('Failed to save note:', e);
            showMessage(t('appointment_error_saving_note'), 'error');
        }
    };

    const handleSavePrescription = useCallback(async (prescribeModal) => {
        try {
            await savePrescription({
                apptId: prescribeModal.apptId,
                medications: prescribeModal.medications,
                instructions: prescribeModal.instructions,
                items: prescribeModal.items,
                bonified: prescribeModal.bonified
            });
            setPrescribeModal({ open: false, apptId: null, patientName: '', medications: '', instructions: '', items: [] });
            showMessage(t('prescription_saved'), 'success');
        } catch (err) {
            console.error('Failed to save prescription:', err);
            showMessage(t('prescription_error'), 'error');
        }
    }, [savePrescription, setPrescribeModal, showMessage, t]);

    const handleDelete = useCallback(async (id, status, adminPassword = null) => {
        const apptData = appointments.find(a => a.id === id) || filteredAppointments.find(a => a.id === id);
        const result = await deleteAppointment(id, apptData, { adminPassword, viewDoctorId: viewDoctorId || selectedDoctor, onUpdate: fetchAppointments });
        if (result?.type === 'AUTH_REQUIRED') {
            setRetryAction({ type: 'delete', args: [id, status] });
            setAuthModalOpen(true);
        }
    }, [appointments, filteredAppointments, deleteAppointment, viewDoctorId, selectedDoctor, fetchAppointments, setRetryAction, setAuthModalOpen]);

    const handleReschedule = useCallback(async (id, newDate, adminPassword = null) => {
        const result = await rescheduleAppointment(id, newDate, adminPassword, fetchAppointments);
        if (result?.type === 'AUTH_REQUIRED') {
            setRetryAction({ type: 'reschedule', args: [id, newDate] });
            setAuthModalOpen(true);
        }
        return result;
    }, [rescheduleAppointment, fetchAppointments, setRetryAction, setAuthModalOpen]);

    const handleSyncGoogleEvent = (appt) => {
        const apptDate = parseDate(appt.appointment_date);
        const localISOTime = toInputDateTime(apptDate);
        setDate(localISOTime);
        setSelectedDoctor(appt.doctor_id);
        const prefillReason = appt.source === 'google-incomplete' ? appt.reason : appt.patient_name;
        setReason(prefillReason || t('appointment_default_reason'));
        setSyncReferenceInfo(prefillReason || t('no_description'));
        if (appt.source === 'google-incomplete') setSyncingZombieId(appt.id);
        setActionModal({ open: false, appt: null });
        setShowForm(true);
        showMessage(t('appointment_sync_started'), "info");
    };

    const handleBook = async (arg1, arg2) => {
        let e = arg2;
        let dateToCheck = arg1;
        if (arg1 && arg1.preventDefault) { e = arg1; e.preventDefault(); dateToCheck = booking?.date; }
        else if (e) e.preventDefault();

        if (dateToCheck) {
            const selectedDatePart = dateToCheck.split('T')[0];
            const isHoliday = holidays.find(h => h.date.startsWith(selectedDatePart));
            if (isHoliday) {
                showMessage((t('cannot_book_holiday')).replace('{description}', isHoliday.description), 'error');
                return;
            }
        }
        await bookAppointment(fetchAppointments);
    };

    const handleWhatsAppSlot = (slot) => {
        const dateObj = parseDate(slot.iso);
        const dateStr = formatDate(dateObj);
        const timeStr = formatDate(dateObj, { time: true }).split(' ')[1] || ''; // Quick way to get time part from formatted string
        const dayName = slot.dayName || formatDate(dateObj, { weekday: true });
        const doctor = doctors.find(d => Number(d.id) === Number(viewDoctorId || selectedDoctor));
        const doctorName = doctor?.full_name || doctor?.name || '';
        
        let message = '';
        const isVirtualSlot = slot.is_virtual || false;
        const messageTemplate = (isVirtualSlot ? doctor?.next_free_slot_virtual_template : doctor?.next_free_slot_template) || settings.next_free_slot_template;

        if (messageTemplate) {
            const slotPrice = isVirtualSlot ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0);
            const address = isVirtualSlot ? t('virtual_location') : (settings.clinic_address || t('default_clinic_address'));
            
            message = messageTemplate
                .replace(/{[\s]*doctor_name[\s]*}/gi, doctorName)
                .replace(/{[\s]*date[\s]*}/gi, slot.formattedDate ? `${dayName} ${slot.formattedDate}` : `${dayName} ${dateStr}`)
                .replace(/{[\s]*time[\s]*}/gi, timeStr)
                .replace(/{[\s]*appointment_type[\s]*}/gi, isVirtualSlot ? t('appointment_type_virtual') : t('appointment_type_in_person'))
                .replace(/{[\s]*appointment_location[\s]*}/gi, address)
                .replace(/{[\s]*price[\s]*}/gi, formatCurrency(slotPrice))
                .replace(/{[\s]*secretary_name[\s]*}/gi, user?.name || t('default_secretary_name'));
        } else {
            message = t('appointment_next_slot_fallback')
                .replace('{appointment_type}', isVirtualSlot ? t('appointment_type_virtual') : t('appointment_type_in_person'))
                .replace('{date}', slot.formattedDate || dateStr)
                .replace('{time}', timeStr)
                .replace('{doctor_name}', doctorName);
        }

        copyToClipboard(message).then(() => {
            showMessage(t('appointment_proposal_copied'), "success");
            let phone = (selectedPatientData?.phone || selectedPatientData?.mobile_phone || '').replace(/\D/g, '');
            if (phone && !phone.startsWith('54') && phone.length >= 10) phone = '549' + phone;
            window.location.href = `whatsapp://send?${phone ? `phone=${phone}&` : ''}text=${encodeURIComponent(message)}`;
        }).catch((clipErr) => {
            console.error('Failed to copy proposal to clipboard:', clipErr);
            showMessage(t('appointment_proposal_copy_error'), 'error');
        });
    };

    const confirmNextSlot = (dateIso, isOutOfHours = false) => {
        const slotDate = parseDate(dateIso);
        setDate(toInputDateTime(slotDate));
        setSelectedDoctor(viewDoctorId || selectedDoctor);
        setIsOutOfHours(!!isOutOfHours);
        setShowNextSlotModal(false);
        setShowForm(true);
    };

    const handleUpdateType = async (id, type) => {
        try {
            await updateAppointment(id, { type }, fetchAppointments);
        } catch (err) {
            console.error('Failed to update appointment type:', err);
            showMessage(t('appointment_type_update_error'), 'error');
        }
    };

    return useMemo(() => ({
        handleDateSelect, handleSlotClick, handleUpdateStatus, handleSavePrescription, handleDelete, handleReschedule,
        handleSyncGoogleEvent, handleBook, handleNextFreeSlot: (sd, override) => fetchNextFreeSlots(sd, override), handleWhatsAppSlot, confirmNextSlot,
        handleAdminAuthConfirm: (retry, pass) => appointmentActions.handleAdminAuthConfirm?.(retry, pass), // Mapping if needed or using direct
        handleUpdateType, handleSaveNote, toggleForm: () => setShowForm(p => !p),
        handleBonify: appointmentActions.handleBonify,
        createPatient: () => { booking.setSelectedPatientData(null); setEditPatientModalOpen(true); },
        openNextSlot: () => { if (setSlotHistory) setSlotHistory([]); fetchNextFreeSlots(null); },
        handleOpenPayment: uiHandlers.handleOpenPayment,
        handleOpenHistory: uiHandlers.handleOpenHistory,
        handleOpenPrescribe: uiHandlers.handleOpenPrescribe,
        handleOpenReschedule: (appt) => navigate('/appointments', { state: { rescheduleAppt: appt } }),
        handleOpenSync: (appt) => navigate('/appointments', { state: { syncAppt: appt } }),
        handleSelectMedication: (med) => setPrescribeModal(prev => ({ ...prev, medications: (prev.medications || '').trim() ? `${prev.medications}\n${med.full_label}` : med.full_label })),
        handleGoToAppointment: (apptId, doctorId, date, onClose) => {
            const apptDate = parseDate(date);
            setSelectedDate(apptDate);
            setViewDoctorId(doctorId);
            if (onClose) onClose();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [
        handleSlotClick, handleDateSelect, handleUpdateStatus, handleSavePrescription, handleDelete, handleReschedule,
        appointmentActions, uiHandlers, booking,
        navigate, fetchNextFreeSlots
    ]);
};

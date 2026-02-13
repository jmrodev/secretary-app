
import { useCallback } from 'react';
import { useAppointmentActions } from './useAppointmentActions';
import { useAppointmentUIHandlers } from './useAppointmentUIHandlers';
import { useHolidayHandlers } from './useHolidayHandlers';
import api from '../api/axios';

export const useAppointmentsHandlers = ({
    // Contexts/External
    user,
    t,
    showMessage,
    confirm,
    navigate,

    // Data/State
    selectedDate,
    viewDoctorId,
    setViewDoctorId,
    selectedDoctor,
    setSelectedDoctor,
    rescheduleAppt,
    holidays,
    appointments,
    filteredAppointments,
    doctors,
    settings,

    // Setters
    setSelectedDate,
    setDate,
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
    setSelectedPatient,
    exitRescheduleMode,

    // Actions (from other hooks)
    updateStatus,
    updateAppointment,
    fetchAppointments,
    savePrescription,
    deleteAppointment,
    rescheduleAppointment,
    bookAppointment,
    setIsOutOfHours,
    fetchNextFreeSlots,
    addHoliday: addHolidayAction,
    deleteHoliday: deleteHolidayAction,
    selectedPatientData,
    copyToClipboard,
    booking,
    setSlotHistory
}) => {

    // Use specialized hooks for better separation of concerns
    const appointmentActions = useAppointmentActions({
        user,
        t,
        showMessage,
        confirm,
        navigate,
        updateStatus,
        updateAppointment,
        deleteAppointment,
        rescheduleAppointment,
        bookAppointment,
        savePrescription,
        fetchAppointments
    });

    const uiHandlers = useAppointmentUIHandlers({
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
    });

    const holidayHandlers = useHolidayHandlers({
        addHoliday: addHolidayAction,
        deleteHoliday: deleteHolidayAction,
        confirm,
        showMessage,
        t
    });

    const handleDateSelect = useCallback((date) => setSelectedDate(date), [setSelectedDate]);

    const handleSlotClick = async (hour, existingAppt, minute = 0, isOutOfHours = false) => {
        if (rescheduleAppt) {
            if (existingAppt) return;

            const toLocalYMD = (d) => {
                const date = new Date(d);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            };
            const selectedYMD = toLocalYMD(selectedDate);
            const isHoliday = holidays.find(h => toLocalYMD(h.date) === selectedYMD);

            if (isHoliday) {
                showMessage((t('cannot_reschedule_holiday') || 'No se puede reprogramar a un feriado: {description}').replace('{description}', isHoliday.description), 'error');
                return;
            }

            const newDate = new Date(selectedDate);
            newDate.setHours(hour, minute, 0, 0);
            const offset = newDate.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);

            if (await confirm(t('confirm_reschedule_to').replace('{date}', new Date(localISOTime).toLocaleString()))) {
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
            const toLocalYMD = (d) => {
                const date = new Date(d);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            };
            const selectedYMD = toLocalYMD(selectedDate);
            const isHoliday = holidays.find(h => toLocalYMD(h.date) === selectedYMD);

            if (isHoliday) {
                showMessage((t('cannot_book_holiday') || 'No se puede reservar en un feriado: {description}').replace('{description}', isHoliday.description), 'error');
                return;
            }

            if (['patient', 'secretary', 'doctor', 'admin'].includes(user.role)) {
                const newDate = new Date(selectedDate);
                newDate.setHours(hour, minute, 0, 0);
                const offset = newDate.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);

                setDate(localISOTime);
                if (viewDoctorId) setSelectedDoctor(viewDoctorId);
                else setSelectedDoctor('');

                setShowForm(true);
                setIsOutOfHours(isOutOfHours);
                setBonified(false);
                setSelectedInstitution('');
            }
        }
    };

    const handleUpdateStatus = async (id, status) => {
        await appointmentActions.handleStatusUpdate(id, status);
        fetchAppointments();
        setActionModal(prev => {
            if (prev.open && prev.appt && prev.appt.id === id) {
                return { ...prev, appt: { ...prev.appt, status: status } };
            }
            return prev;
        });
    };

    const handleSaveNote = async (apptId, note, date) => {
        try {
            await api.put(`/appointments/${apptId}`, { reason: note, appointment_date: date });
            showMessage(t('note_saved') || 'Nota actualizada', 'success');
            fetchAppointments();
        } catch (e) {
            console.error(e);
            showMessage('Error al guardar nota', 'error');
        }
    };

    const handleSavePrescription = async (prescribeModal) => {
        try {
            await savePrescription({
                apptId: prescribeModal.apptId,
                medications: prescribeModal.medications,
                instructions: prescribeModal.instructions,
                items: prescribeModal.items
            });
            setPrescribeModal({ open: false, apptId: null, patientName: '', medications: '', instructions: '', items: [] });
            showMessage(t('prescription_saved') || 'Receta guardada', 'success');
        } catch (error) {
            showMessage(t('prescription_error') || 'Error al guardar receta', 'error');
        }
    };

    const handleSelectMedication = (med) => {
        setPrescribeModal(prev => {
            const current = (prev.medications || '').trim();
            const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
            return { ...prev, medications: newValue };
        });
    };

    const handleDelete = async (id, status, adminPassword = null) => {
        const apptData = appointments.find(a => a.id === id) || filteredAppointments.find(a => a.id === id);
        const result = await deleteAppointment(id, apptData, {
            adminPassword,
            viewDoctorId: viewDoctorId || selectedDoctor,
            onUpdate: fetchAppointments
        });

        if (result?.type === 'AUTH_REQUIRED') {
            setRetryAction({ type: 'delete', args: [id, status] });
            setAuthModalOpen(true);
        }
    };

    const handleReschedule = async (id, newDate, adminPassword = null) => {
        const result = await rescheduleAppointment(id, newDate, adminPassword, fetchAppointments);
        if (result?.type === 'AUTH_REQUIRED') {
            setRetryAction({ type: 'reschedule', args: [id, newDate] });
            setAuthModalOpen(true);
        }
        return result;
    };

    const handleSyncGoogleEvent = (appt) => {
        const apptDate = new Date(appt.appointment_date);
        const offset = apptDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(apptDate - offset)).toISOString().slice(0, 16);

        setDate(localISOTime);
        setSelectedDoctor(appt.doctor_id);

        const prefillReason = appt.source === 'google-incomplete' ? appt.reason : appt.patient_name;
        setReason(prefillReason || 'Consulta');
        setSyncReferenceInfo(prefillReason || 'Sin descripción');

        if (appt.source === 'google-incomplete') setSyncingZombieId(appt.id);
        else setSyncingZombieId(null);

        setActionModal({ open: false, appt: null });
        setShowForm(true);
        showMessage("Ajuste iniciado: Por favor seleccione el paciente para este turno.", "info");
    };

    const handleBook = async (arg1, arg2) => {
        let e = arg2;
        let dateToCheck = arg1;

        // If called as form submit handler, arg1 is event
        if (arg1 && arg1.preventDefault) {
            e = arg1;
            e.preventDefault();
            dateToCheck = booking?.date;
        } else if (e) {
            e.preventDefault();
        }

        if (!dateToCheck) {
            console.warn("No date to check for holiday");
        } else {
            const selectedDatePart = dateToCheck.split('T')[0];
            const isHoliday = holidays.find(h => h.date.startsWith(selectedDatePart));
            if (isHoliday) {
                showMessage((t('cannot_book_holiday') || 'No se puede reservar en un feriado: {description}').replace('{description}', isHoliday.description), 'error');
                return;
            }
        }
        await bookAppointment(fetchAppointments);
    };

    const handleNextFreeSlot = async (startDate = null, overrideOutOfHours = null) => {
        await fetchNextFreeSlots(startDate, overrideOutOfHours);
    };

    const handleWhatsAppSlot = (slot) => {
        const dateObj = new Date(slot.iso);
        const dateStr = dateObj.toLocaleDateString('es-AR'); // 29/1/2026
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // 09:00

        // Calculate day name properly if missing
        const dayName = slot.dayName || dateObj.toLocaleDateString('es-AR', { weekday: 'long' });

        const docId = Number(viewDoctorId || selectedDoctor);
        const doctor = doctors.find(d => Number(d.id) === docId);
        const doctorName = doctor?.full_name || doctor?.name || '';

        // 1. Generate Message (Keep existing sophisticated logic)
        let message = '';
        if (settings.next_free_slot_template) {
            const isVirtualSlot = slot.is_virtual || false;
            const slotPrice = isVirtualSlot ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0);
            const address = isVirtualSlot ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255');
            const formatPrice = (p) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(p);

            message = settings.next_free_slot_template
                .replace(/{[\s]*doctor_name[\s]*}/gi, doctorName)
                .replace(/{[\s]*date[\s]*}/gi, slot.formattedDate ? `${dayName} ${slot.formattedDate}` : `${dayName} ${dateStr}`)
                .replace(/{[\s]*time[\s]*}/gi, timeStr)
                .replace(/{[\s]*appointment_type[\s]*}/gi, isVirtualSlot ? 'VIRTUAL' : 'PRESENCIAL')
                .replace(/{[\s]*appointment_location[\s]*}/gi, address)
                .replace(/{[\s]*price[\s]*}/gi, formatPrice(slotPrice))
                .replace(/{[\s]*secretary_name[\s]*}/gi, user.name || 'Secretaría');
        } else {
            message = `Hola, tenemos un turno disponible el ${slot.formattedDate ? `${dayName} ${slot.formattedDate}` : `${dayName} ${dateStr}`} a las ${timeStr} con el/la Dr/a. ${doctorName}. ¿Le gustaría reservarlo?`;
        }

        // 2. Determine target phone
        // Logic from user snippet: "phone = selectedPatientData?.mobile_phone || selectedPatientData?.contact_info || '';"
        // Adapting to our data structure (selectedPatientData.phone seems standard, but we'll add fallbacks)
        let phone = selectedPatientData?.phone || selectedPatientData?.mobile_phone || selectedPatientData?.contact_info || '';

        // 3. Execute Action (Copy + Redirect)
        copyToClipboard(message).then(() => {
            showMessage("Propuesta copiada! Abriendo WhatsApp...", "success");

            phone = phone.replace(/\D/g, '');
            if (phone && !phone.startsWith('54') && phone.length >= 10) phone = '549' + phone;

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            } else {
                const appUrl = phone
                    ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`
                    : `whatsapp://send?text=${encodeURIComponent(message)}`;
                const webUrl = phone
                    ? `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
                    : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;

                // Priority ZapZap -> Web (User snippet logic)
                window.location.href = appUrl;
                // Fallback to Web if App doesn't open (simple timeout heuristic)
                setTimeout(() => window.open(webUrl, '_blank'), 2500);
            }
        }).catch(err => {
            console.error("Copy failed", err);
            // Fallback to Modal if copy fails? Or just error.
            // For now, adhere to snippet, maybe just log or show error.
            showMessage("Error al copiar al portapapeles", "error");
            setWhatsappModal({
                open: true,
                phone: phone,
                message
            });
        });
    };

    const confirmNextSlot = (dateIso, isOutOfHours = false) => {
        const slotDate = new Date(dateIso);
        const offset = slotDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(slotDate - offset)).toISOString().slice(0, 16);

        setDate(localISOTime);
        // If doctor not matched, maybe alert or default? viewDoctorId usually set.
        setSelectedDoctor(viewDoctorId || selectedDoctor);
        setIsOutOfHours(isOutOfHours === true || isOutOfHours === 1);
        setShowNextSlotModal(false);
        setShowForm(true);
    };

    const handleAdminAuthConfirm = async (retryAction, password) => {
        if (retryAction) {
            setAuthModalOpen(false);
            const { type, args } = retryAction;
            if (type === 'delete') await handleDelete(args[0], args[1], password);
            if (type === 'reschedule') {
                const result = await handleReschedule(args[0], args[1], password);
                if (result?.success) exitRescheduleMode();
            }
            setRetryAction(null);
        }
    };

    const handleUpdateType = async (id, type) => {
        await updateAppointment(id, { type }, fetchAppointments);
    };

    const handleHardEdit = (appt) => {
        // Prepare booking state for editing
        booking.setSelectedDoctor(appt.doctor_id);
        booking.setType(appt.type);
        booking.setSelectedPatient(appt.patient_id);
        booking.setSelectedPatientData({
            id: appt.patient_id,
            full_name: appt.patient_name,
            phone: appt.patient_phone,
            dni: appt.patient_dni
        });

        // Format date for datetime-local input
        const d = new Date(appt.appointment_date);
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - offset)).toISOString().slice(0, 16);
        booking.setDate(localISOTime);

        booking.setReason(appt.reason);
        booking.setBonified(appt.bonified === 1 || appt.bonified === true);
        booking.setSelectedInstitution(appt.institution_id || '');
        booking.setSyncReferenceInfo(appt.patient_name || appt.reason);

        // We use editModeId to signal booking hook that this is an UPDATE, not a CREATE.
        booking.setEditModeId(appt.id);
        booking.setIsOutOfHours(appt.is_out_of_hours === 1 || appt.is_out_of_hours === true || String(appt.is_out_of_hours) === 'true');
        booking.setShowForm(true);
    };

    const handleAddHoliday = async (date, description) => {
        return await addHolidayAction(date, description);
    };

    const handleOpenPayment = uiHandlers.handleOpenPayment;
    const handleOpenHistory = uiHandlers.handleOpenHistory;
    const handleOpenPrescribe = uiHandlers.handleOpenPrescribe;
    const handleDeleteHoliday = holidayHandlers.handleDeleteHoliday;

    const handleOpenReschedule = (appt) => {
        navigate('/appointments', { state: { rescheduleAppt: appt } });
    };

    const handleOpenSync = (appt) => {
        navigate('/appointments', { state: { syncAppt: appt } });
    };

    const toggleForm = () => setShowForm(prev => !prev);

    const createPatient = () => {
        booking.setSelectedPatientData(null);
        setEditPatientModalOpen(true);
    };

    const openNextSlot = () => {
        if (setSlotHistory) setSlotHistory([]);
        handleNextFreeSlot(null);
    };

    return {
        handleDateSelect,
        handleSlotClick,
        handleUpdateStatus,
        handleSavePrescription,
        handleDelete,
        handleReschedule,
        handleSyncGoogleEvent,
        handleBook,
        handleNextFreeSlot,
        handleWhatsAppSlot,
        confirmNextSlot,
        handleAdminAuthConfirm,
        handleUpdateType,
        handleHardEdit,
        handleAddHoliday,
        handleDeleteHoliday,
        handleOpenPayment,
        handleOpenHistory,
        handleOpenPrescribe,
        handleOpenReschedule,
        handleOpenSync,
        handleSelectMedication,
        toggleForm,
        createPatient,
        openNextSlot,
        handleSaveNote,
        handleGoToAppointment: (apptId, doctorId, date, onClose) => {
            const apptDate = new Date(date);
            const offset = apptDate.getTimezoneOffset() * 60000;
            const localDate = new Date(apptDate.getTime() + offset);
            setSelectedDate(localDate);
            setViewDoctorId(doctorId);
            if (onClose) onClose();
        },
        handleRepeatAppointment: (patientId, reason) => {
            setSelectedPatient(patientId);
            setReason(reason);
            setShowForm(true);
        }
    };
};

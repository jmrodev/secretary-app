
import { useCallback } from 'react';

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
    selectedDoctor,
    rescheduleAppt,
    holidays,
    appointments,
    filteredAppointments,
    doctors,
    settings,

    // Setters
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
    exitRescheduleMode,

    // Actions (from other hooks)
    updateStatus,
    fetchAppointments,
    savePrescription,
    deleteAppointment,
    rescheduleAppointment,
    bookAppointment,
    fetchNextFreeSlots,
    selectedPatientData,
    copyToClipboard, // Dependency injected
    booking
}) => {

    const handleDateSelect = useCallback((date) => setSelectedDate(date), [setSelectedDate]);

    const handleSlotClick = async (hour, existingAppt, minute = 0) => {
        if (rescheduleAppt) {
            if (existingAppt) return;

            const newDate = new Date(selectedDate);
            newDate.setHours(hour, minute, 0, 0);
            const offset = newDate.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);

            if (await confirm(t('confirm_reschedule_to').replace('{date}', new Date(localISOTime).toLocaleString()))) {
                handleReschedule(rescheduleAppt.id, localISOTime);
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
                else setSelectedDoctor('');

                setShowForm(true);
                setBonified(false);
                setSelectedInstitution('');
            }
        }
    };

    const handleUpdateStatus = async (id, status) => {
        await updateStatus(id, status, (id, newStatus) => {
            fetchAppointments();
            setActionModal(prev => {
                if (prev.open && prev.appt && prev.appt.id === id) {
                    return { ...prev, appt: { ...prev.appt, status: newStatus } };
                }
                return prev;
            });
        });
    };

    const handleSavePrescription = async (prescribeModal) => {
        await savePrescription({
            apptId: prescribeModal.apptId,
            medications: prescribeModal.medications,
            instructions: prescribeModal.instructions
        }, () => {
            setPrescribeModal({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
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
                showMessage(`Cannot book: ${isHoliday.description}`, 'error');
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
                .replace(/{[\s]*date[\s]*}/gi, `${dayName} ${dateStr}`)
                .replace(/{[\s]*time[\s]*}/gi, timeStr)
                .replace(/{[\s]*appointment_type[\s]*}/gi, isVirtualSlot ? 'VIRTUAL' : 'PRESENCIAL')
                .replace(/{[\s]*appointment_location[\s]*}/gi, address)
                .replace(/{[\s]*price[\s]*}/gi, formatPrice(slotPrice))
                .replace(/{[\s]*secretary_name[\s]*}/gi, user.name || 'Secretaría');
        } else {
            message = `Hola, tenemos un turno disponible el ${dayName} ${dateStr} a las ${timeStr} con el/la Dr/a. ${doctorName}. ¿Le gustaría reservarlo?`;
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

    const confirmNextSlot = (dateIso) => {
        const slotDate = new Date(dateIso);
        const offset = slotDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(slotDate - offset)).toISOString().slice(0, 16);

        setDate(localISOTime);
        // If doctor not matched, maybe alert or default? viewDoctorId usually set.
        setSelectedDoctor(viewDoctorId || selectedDoctor);
        setShowNextSlotModal(false);
        setShowForm(true);
    };

    const handleAdminAuthConfirm = (retryAction, password) => {
        if (retryAction) {
            setAuthModalOpen(false);
            const { type, args } = retryAction;
            if (type === 'delete') handleDelete(args[0], args[1], password);
            if (type === 'reschedule') handleReschedule(args[0], args[1], password);
            setRetryAction(null);
        }
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
        handleAdminAuthConfirm
    };
};

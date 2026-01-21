import { useState, useEffect, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { copyToClipboard } from '../utils/clipboardUtils';
import { useConfig } from '../context/ConfigContext';
import TransactionModal from '../components/TransactionModal';
import Calendar from '../components/Calendar';
import DaySchedule from '../components/DaySchedule';
import PatientSearchSelect from '../components/PatientSearchSelect';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import PatientHistoryModal from '../components/PatientHistoryModal';
import PatientEditModal from '../components/PatientEditModal';
import MedicationAutocomplete from '../components/MedicationAutocomplete';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    // const [patients, setPatients] = useState([]); // Removed bulk fetch
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { alert, confirm, prompt } = useModal();
    const navigate = useNavigate();
    const location = useLocation();

    // Reschedule/Sync Mode state (from navigation)
    const rescheduleAppt = location.state?.rescheduleAppt;
    const syncAppt = location.state?.syncAppt;

    const exitRescheduleMode = () => {
        navigate(location.pathname, { replace: true, state: {} });
    };

    // View State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDoctorId, setViewDoctorId] = useState(localStorage.getItem('last_selected_doctor_id') || ''); // Filter for Calendar/Schedule

    const [searchPatientId, setSearchPatientId] = useState(''); // [NEW] Filter by Patient
    const [patientAppointments, setPatientAppointments] = useState([]); // [NEW] List for specific patient
    const [syncingZombieId, setSyncingZombieId] = useState(null); // [NEW] Track unlinked appt to replace
    const [syncReferenceInfo, setSyncReferenceInfo] = useState(null); // [NEW] Info to show during adjustment
    const [patientApptLoading, setPatientApptLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // [NEW] Search filter for appointments



    // Form Stats
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedPatientData, setSelectedPatientData] = useState(null); // Full object
    const [missingData, setMissingData] = useState([]);
    const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
    const [whatsappModal, setWhatsappModal] = useState({ open: false, phone: '', message: '' });
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('Consulta'); // Default reason
    const [bonified, setBonified] = useState(false); // [NEW] Bonificado
    const [type, setType] = useState('consultation'); // [NEW] Virtual/Consultation
    const [message, setMessage] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    const [googleEvents, setGoogleEvents] = useState([]); // Store remote events
    const [holidays, setHolidays] = useState([]); // Store holidays
    const [doctorSchedule, setDoctorSchedule] = useState([]); // doctorSchedule moved here to be initialized before use

    // Action Modal State (Moved up or re-declared if missed)
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    // [prescribeModal needed here if not below]
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });

    // Next available slot modal
    const [nextSlotData, setNextSlotData] = useState(null); // { slot, breakSlot }
    const [showNextSlotModal, setShowNextSlotModal] = useState(false);
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'holidays'
    const [slotHistory, setSlotHistory] = useState([]);
    const [currentSlotParams, setCurrentSlotParams] = useState(null);

    const fetchAppointments = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;

            const res = await api.get('/appointments', { params });
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        }
    };

    // [NEW] Trigger fetch when searchTerm changes (with debounce could be better, but simple for now)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAppointments();
        }, 500); // Debounce 500ms
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchHolidays = async () => {
        try {
            const res = await api.get('/holidays');
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        }
    };

    // Handle persistence of doctor selection
    useEffect(() => {
        // ALWAYS save the view preference, even if empty (All Doctors)
        localStorage.setItem('last_selected_doctor_id', viewDoctorId);

        // Also sync selectedDoctor for the form if it was empty
        if (!selectedDoctor && viewDoctorId) setSelectedDoctor(viewDoctorId);
    }, [viewDoctorId]);

    useEffect(() => {
        // Always save the form doctor preference, even if empty (no doctor selected for form)
        localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        // Also sync viewDoctorId for the view if it was empty
        if (!viewDoctorId) setViewDoctorId(selectedDoctor);
    }, [selectedDoctor]);

    // Keyboard navigation for Next Slot Modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!showNextSlotModal) return;

            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                if (slotHistory.length > 0) {
                    const prevDate = slotHistory[slotHistory.length - 1];
                    setSlotHistory(prev => prev.slice(0, -1));
                    setCurrentSlotParams(prevDate);
                    handleNextFreeSlot(prevDate);
                }
            } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                if (nextSlotData?.nextStartDate) {
                    setSlotHistory(prev => [...prev, currentSlotParams]);
                    setCurrentSlotParams(nextSlotData.nextStartDate);
                    handleNextFreeSlot(nextSlotData.nextStartDate);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showNextSlotModal, slotHistory, nextSlotData, currentSlotParams]);

    // [NEW] Update default appointment type based on schedule
    useEffect(() => {
        if (!selectedDoctor || !date) return;

        const updateType = async () => {
            try {
                // If we already have the schedule in doctorSchedule state (matching viewDoctorId)
                let relevantSchedule = doctorSchedule;

                // If selectedDoctor is different, we might need to fetch it 
                // but usually doctorSchedule is already what we need if we came from handleSlotClick
                if (viewDoctorId != selectedDoctor) {
                    const res = await api.get(`/schedules/${selectedDoctor}`);
                    relevantSchedule = res.data;
                }

                if (!relevantSchedule || relevantSchedule.length === 0) {
                    // setType('consultation'); // Don't reset if no schedule found, maybe they chose manually
                    return;
                }

                const dateObj = new Date(date.includes('T') ? date : date.replace(' ', 'T'));
                const dayOfWeek = dateObj.getDay();

                const config = relevantSchedule.find(s => s.day_of_week === dayOfWeek);
                if (config && config.default_type) {
                    setType(config.default_type);
                } else {
                    setType('consultation');
                }
            } catch (err) {
                console.error("Error updating default type:", err);
            }
        };

        updateType();
    }, [selectedDoctor, date, doctorSchedule]);

    // [NEW] Fetch patient specific appointments
    useEffect(() => {
        if (searchPatientId) {
            fetchPatientAppointments(searchPatientId);
        } else {
            setPatientAppointments([]);
        }
    }, [searchPatientId]);

    const fetchPatientAppointments = async (pId) => {
        setPatientApptLoading(true);
        try {
            const res = await api.get('/appointments', { params: { patientId: pId } });
            setPatientAppointments(res.data);
        } catch (err) {
            console.error(err);
            showMessage(t('error') || 'Error fetching history', 'error');
        } finally {
            setPatientApptLoading(false);
        }
    };


    // Fetch Google Events and Doctor Schedule
    useEffect(() => {
        const fetchGoogle = async () => {
            if (!viewDoctorId) {
                setGoogleEvents([]);
                setDoctorSchedule([]); // Reset
                return;
            }

            try {
                // Fetch Schedule
                const schedRes = await api.get(`/schedules/${viewDoctorId}`);
                setDoctorSchedule(schedRes.data);

                // Fetch Google Events
                const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1).toISOString();
                const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0).toISOString();
                const res = await api.get(`/google/appointments?doctorId=${viewDoctorId}&start=${start}&end=${end}`);

                // Map to App format
                const mapped = res.data.events.map(e => ({
                    id: `goo_${e.id}`,
                    patient_name: e.summary || 'Google Event',
                    full_name: e.summary || 'Google Event',
                    appointment_date: e.start.dateTime || e.start.date,
                    status: 'external',
                    doctor_id: Number(viewDoctorId),
                    source: 'google'
                }));
                setGoogleEvents(mapped);

            } catch (err) {
                console.log("Google/Schedule Fetch skipped or failed");
                if (err.response?.status !== 404) setGoogleEvents([]); // 404 might mean no schedule but keep connection?
            }
        };
        fetchGoogle();
    }, [viewDoctorId, selectedDate, user.role]);

    const fetchAllData = async () => {
        await fetchAppointments();
        await fetchHolidays();
        try {
            // Fetch doctors for selection
            const dRes = await api.get('/users/doctors');
            setDoctors(dRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user.role]);

    // Auto-select doctor view if user is a doctor OR if in Reschedule Mode
    useEffect(() => {
        if (rescheduleAppt) {
            setViewDoctorId(rescheduleAppt.doctor_id);
            return;
        }

        if (syncAppt) {
            setViewDoctorId(syncAppt.doctor_id);
            setSelectedDate(new Date(syncAppt.appointment_date));
            handleSyncGoogleEvent(syncAppt);
        }

        if (user.role === 'doctor' && doctors.length > 0) {
            const myDoctorProfile = doctors.find(d => d.user_id === (user.user_id || user.id));
            if (myDoctorProfile) {
                setViewDoctorId(myDoctorProfile.id);
            }
        }
    }, [user, doctors, rescheduleAppt, syncAppt]);

    // Computed appointments based on filter
    const currentDoctor = viewDoctorId ? doctors.find(d => d.id === Number(viewDoctorId)) : null;

    const localFiltered = appointments.filter(app => {
        if (searchPatientId) return app.patient_id === Number(searchPatientId);
        if (viewDoctorId) return app.doctor_id === Number(viewDoctorId);
        return true;
    }).map(app => {
        // If it's in the DB but has no patient_id and has a google_event_id, it's "incomplete"
        if (!app.patient_id && app.google_event_id) {
            return { ...app, source: 'google-incomplete', status: 'external' }; // Force 'external' for styling
        }
        return app;
    });

    // Filter out Google events that are already in our local database (to avoid duplicates)
    const uniqueGoogleEvents = googleEvents.filter(ge => {
        const originalId = ge.id.replace('goo_', '');
        // Check if ANY local appointment has this google_event_id
        const exists = appointments.some(appt => appt.google_event_id === originalId);
        return !exists;
    });

    // Merge
    // Merge and Filter Global
    const filteredAppointments = [...localFiltered, ...uniqueGoogleEvents].filter(app => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();

        // Check various fields for matches
        // For Google events, patient_name holds the summary
        const matchesName = (app.patient_name || app.full_name || '').toLowerCase().includes(term);
        const matchesReason = (app.reason || '').toLowerCase().includes(term);
        const matchesPhone = (app.patient_phone || '').toLowerCase().includes(term); // Phone might be string

        return matchesName || matchesReason || matchesPhone;
    });

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleSlotClick = async (hour, existingAppt, minute = 0) => {
        if (rescheduleAppt) {
            if (existingAppt) return; // Can't reschedule onto another appt

            const newDate = new Date(selectedDate);
            newDate.setHours(hour, minute, 0, 0);

            // Adjust timezone to local ISO string for input
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
            // Existing booking logic
            // ... (keep existing booking logic from original file here, or refactor. Since I can't see the original lines 140+ fully in context of replacement without copy-paste, I will assume I need to copy the `else` block content or just inject logic before it?) 
            // Better: Updating `handleSlotClick` entirely to use `actionModal` for existing.
            // The logic below recreates existing logic for "New Appointment" inside the else.

            // Check if selected date is a holiday
            // ... (rest of booking logic)
            // RE-INSERTING ORIGINAL BOOKING LOGIC BELOW:
            // Robust Date Comparison (Local YYYY-MM-DD)
            const toLocalYMD = (d) => {
                const date = new Date(d);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            };

            const selectedYMD = toLocalYMD(selectedDate);
            const isHoliday = holidays.find(h => {
                // h.date comes as ISO string e.g. 2026-05-01T03:00:00.000Z. 
                // We create a Date object from it, which converts to Local Time.
                // Then we extract YMD.
                return toLocalYMD(h.date) === selectedYMD;
            });

            if (isHoliday) {
                setMessage(`Cannot book on ${selectedYMD}: ${isHoliday.description}`);
                return;
            }

            if (user.role === 'patient' || user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') {
                const newDate = new Date(selectedDate);
                newDate.setHours(hour, minute, 0, 0);

                // Adjust timezone to local ISO string for input
                const offset = newDate.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);

                setDate(localISOTime);
                // Pre-fill doctor if filtered, otherwise reset to empty to allow selection
                if (viewDoctorId) {
                    setSelectedDoctor(viewDoctorId);
                } else {
                    setSelectedDoctor('');
                }
                setShowForm(true);
                setBonified(false);
            }
        }
    };

    const handleUpdateStatus = async (id, status) => {
        let reason = null;
        if (status === 'cancelled') {
            reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
            if (reason === null) return; // User cancelled the prompt
        }

        try {
            await api.put(`/appointments/${id}/status`, { status, reason });
            setMessage(t('status_updated'));
            fetchAppointments();
            // Update actionModal appt state if open
            if (actionModal.open && actionModal.appt && actionModal.appt.id === id) {
                setActionModal(prev => ({
                    ...prev,
                    appt: { ...prev.appt, status }
                }));
            }
        } catch (err) {
            console.error(err);
            setMessage(t('failed_update'));
        }
    };

    const handleSavePrescription = async () => {
        if (!prescribeModal.medications.trim()) {
            showMessage(t('please_enter_meds'), 'warning');
            return;
        }

        try {
            await api.post('/medical/prescriptions', {
                appointment_id: prescribeModal.apptId,
                medications: prescribeModal.medications,
                instructions: prescribeModal.instructions
            });
            showMessage(t('prescription_created'), 'success');
            setPrescribeModal({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || t('failed_prescription');
            showMessage(errMsg, 'error');
        }
    };

    const handleDelete = async (id, status) => {
        if (status === 'attended' && settings.enable_secretary_unrestricted_crud !== 'true') return alert(t('cannot_delete_attended') || "Cannot delete an appointment that has been attended.");
        if (!await confirm(t('confirm_delete_appointment') || "Are you sure? This will remove the record mostly (Secretary Error).")) return;
        try {
            if (String(id).startsWith('goo_')) {
                // Handle Google Event Deletion
                const eventId = id.replace('goo_', '');
                await api.delete(`/google/appointments/${eventId}`, { data: { doctorId: viewDoctorId || selectedDoctor } });
                setMessage(t('appointment_deleted'));
                // Manually remove since it won't be in DB yet if we just added it, or force refetch
                setGoogleEvents(prev => prev.filter(e => e.id !== id));
            } else {
                // Standard DB Deletion
                await api.delete(`/appointments/${id}`);
                setMessage(t('appointment_deleted'));
                fetchAppointments();
            }
        } catch (err) {
            console.error(err);
            const serverError = err.response?.data?.error || err.response?.data;
            setMessage(serverError || t('failed_delete'));
        }
    };

    const handleReschedule = async (id, newDate) => {
        try {
            const isoDate = new Date(newDate).toISOString();
            await api.put(`/appointments/${id}`, { appointment_date: isoDate });
            setMessage(t('rescheduled_success'));
            fetchAppointments();
        } catch (err) {
            console.error(err);
            setMessage(t('failed_reschedule'));
        }
    };

    const handleToggleVirtual = async (appointment) => {
        try {
            const newType = appointment.type === 'virtual' ? 'consultation' : 'virtual';
            await api.patch(`/appointments/${appointment.id}/type`, { type: newType });

            // Optimistic update
            setAppointments(prev => prev.map(a =>
                a.id === appointment.id ? { ...a, type: newType } : a
            ));

            // fetchAppointments(); // Optional if optimistic is enough
            showMessage(`Turno cambiado a ${newType === 'virtual' ? 'Videollamada' : 'Presencial'}`, 'success');
        } catch (err) {
            console.error(err);
            showMessage("Error al cambiar tipo de turno", 'error');
        }
    };

    const handleSyncGoogleEvent = (appt) => {
        // Prepare data for the form
        const apptDate = new Date(appt.appointment_date);
        const offset = apptDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(apptDate - offset)).toISOString().slice(0, 16);

        setDate(localISOTime);
        setSelectedDoctor(appt.doctor_id);

        // If it's a zombie in DB, we use 'reason' field as the name/description source
        const prefillReason = appt.source === 'google-incomplete' ? appt.reason : appt.patient_name;
        setReason(prefillReason || 'Consulta');

        // Store original info to show as reference in the form
        setSyncReferenceInfo(prefillReason || 'Sin descripción');

        if (appt.source === 'google-incomplete') {
            setSyncingZombieId(appt.id); // Mark for replacement
        } else {
            setSyncingZombieId(null);
        }

        setActionModal({ open: false, appt: null });
        setShowForm(true);
        showMessage("Ajuste iniciado: Por favor seleccione el paciente para este turno.", "info");
    };

    const handleBook = async (e) => {
        e.preventDefault();
        // setMessage(''); // Use global toast instead

        // Client-side holiday check
        const selectedDatePart = date.split('T')[0];
        const isHoliday = holidays.find(h => h.date.startsWith(selectedDatePart));
        if (isHoliday) {
            showMessage(`Cannot book: ${isHoliday.description}`, 'error');
            return;
        }

        console.log("Booking Appointment with:", {
            doctor_id: selectedDoctor,
            patient_id: selectedPatient,
            date: date,
            reason
        });

        try {
            await api.post('/appointments', {
                doctor_id: selectedDoctor,
                patient_id: (user.role === 'secretary' || user.role === 'doctor') ? selectedPatient : undefined,
                appointment_date: new Date(date).toISOString(),
                reason: reason || 'Consulta', // Ensure it sends 'Consulta' if empty for some reason
                bonified, // [NEW]
                type // [NEW]
            });

            // If we were replacing a zombie, delete the old one
            if (syncingZombieId) {
                try {
                    await api.delete(`/appointments/${syncingZombieId}`);
                    console.log(`Deleted zombie appointment ${syncingZombieId} after successful adjustment.`);
                } catch (delErr) {
                    console.warn("Failed to delete zombie (non-critical):", delErr);
                }
                setSyncingZombieId(null);
            }

            showMessage(t('appointment_booked'), 'success');
            setShowForm(false);

            // WhatsApp Confirmation Prompt
            const isVirtual = type === 'virtual';
            const template = (isVirtual && settings.appointment_confirmation_virtual_template)
                ? settings.appointment_confirmation_virtual_template
                : settings.appointment_confirmation_template;

            if (template && selectedPatientData && selectedPatientData.phone) {
                const apptDateObj = new Date(date);
                const dateStr = apptDateObj.toLocaleDateString();
                const timeStr = apptDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const doctor = doctors.find(d => d.id === Number(selectedDoctor));
                const doctorName = doctor?.full_name || 'Doctor';
                const consultationPrice = isVirtual ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0);
                const address = isVirtual ? 'Virtual (Cima Salud)' : (settings.clinic_address || 'Montiel 1255');

                let msg = template
                    .replace(/{patient_name}/g, selectedPatientData.full_name)
                    .replace(/{date}/g, dateStr)
                    .replace(/{time}/g, timeStr)
                    .replace(/{doctor_name}/g, doctorName)
                    .replace(/{appointment_type}/g, isVirtual ? 'VIRTUAL' : 'PRESENCIAL')
                    .replace(/{appointment_location}/g, address)
                    .replace(/{price}/g, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(consultationPrice))
                    .replace(/{secretary_name}/g, user.name || 'Secretaría');

                setWhatsappModal({
                    open: true,
                    phone: selectedPatientData.phone,
                    message: msg
                });
            }

            setReason('Consulta'); // Reset to default 'Consulta'
            setDate('');
            setType('consultation');
            fetchAppointments();
        } catch (err) {
            const serverError = err.response?.data?.error || err.response?.data;
            const msg = serverError || t('failed_book');
            console.error("Booking Error:", err);
            showMessage(msg, 'error');
        }
    };

    const handleCancel = async (id) => {
        const reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
        if (!reason) return;
        if (!await confirm(t('confirm_cancel'))) return;

        try {
            await api.put(`/appointments/${id}/status`, { status: 'cancelled', reason }); // Send reason
            setMessage(t('appointment_cancelled'));
            fetchAppointments();
        } catch (err) {
            setMessage(t('failed_cancel'));
            console.error(err);
        }
    };

    const handleRatingChange = async (patientId, newRating) => {
        if (user.role !== 'secretary' && user.role !== 'doctor') return;
        try {
            await api.put(`/users/patients/${patientId}`, { financial_rating: newRating });
            // Optimistically update or refetch
            setAppointments(prev => prev.map(app =>
                app.patient_id === patientId ? { ...app, financial_rating: newRating } : app
            ));
        } catch (err) {
            console.error("Failed to update rating", err);
        }
    };

    const handleWhatsAppSlot = (slot) => {
        const dateStr = new Date(slot.iso).toLocaleDateString();
        const timeStr = new Date(slot.iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Robust doctor search
        const docId = Number(viewDoctorId || selectedDoctor);
        const doctor = doctors.find(d => Number(d.id) === docId);
        const doctorName = doctor?.full_name || doctor?.name || '';

        let message = '';
        if (settings.next_free_slot_template) {
            const isVirtualSlot = slot.is_virtual || false;
            const doctor = doctors.find(d => Number(d.id) === docId);
            const slotPrice = isVirtualSlot ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0);
            const address = isVirtualSlot ? 'Virtual/Online' : (settings.clinic_address || 'Montiel 1255');

            message = settings.next_free_slot_template
                .replace(/{[\s]*doctor_name[\s]*}/gi, doctorName)
                .replace(/{[\s]*date[\s]*}/gi, `${slot.dayName} ${dateStr}`)
                .replace(/{[\s]*time[\s]*}/gi, timeStr)
                .replace(/{[\s]*appointment_type[\s]*}/gi, isVirtualSlot ? 'VIRTUAL' : 'PRESENCIAL')
                .replace(/{[\s]*appointment_location[\s]*}/gi, address)
                .replace(/{[\s]*price[\s]*}/gi, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(slotPrice))
                .replace(/{[\s]*secretary_name[\s]*}/gi, user.name || 'Secretaría');
        } else {
            message = `Hola, tenemos un turno disponible el ${slot.dayName} ${dateStr} a las ${timeStr} con el/la Dr/a. ${doctorName}. ¿Le gustaría reservarlo?`;
        }

        // Try to get patient phone if a patient is selected
        let phone = selectedPatientData?.phone || selectedPatientData?.mobile_phone || '';

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

                // Priority ZapZap -> Web
                window.location.href = appUrl;
                setTimeout(() => window.open(webUrl, '_blank'), 2500);
            }
        });
    };

    const handleNextFreeSlot = async (startDate = null) => {
        const docId = viewDoctorId || selectedDoctor;
        if (!docId) {
            showMessage("Por favor, selecciona un médico primero para buscar turnos.", 'warning');
            return;
        }

        try {
            setLoading(true);
            const params = { doctor_id: docId };
            // If startDate is passed (for pagination)
            if (startDate && typeof startDate === 'string') params.start_date = startDate;

            const res = await api.get('/appointments/next-free-batch', { params });
            setLoading(false);

            if (res.data && res.data.results && res.data.results.length > 0) {
                setNextSlotData(res.data); // Store full response { results: [], nextStartDate: '' }
                setShowNextSlotModal(true);
            } else {
                showMessage("No se encontraron más turnos libres en el rango analizado.", 'info');
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
            showMessage("Error buscando turnos libres.", 'error');
        }
    };

    const confirmNextSlot = (dateIso) => {
        const slotDate = new Date(dateIso);
        // Adjust timezone to local ISO string for input
        const offset = slotDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(slotDate - offset)).toISOString().slice(0, 16);

        setDate(localISOTime);
        setSelectedDoctor(viewDoctorId || selectedDoctor);
        setShowNextSlotModal(false);
        setShowForm(true);
    };

    const handleWhatsAppConfirm = (appt) => {
        let phone = appt.patient_phone;

        if (!phone) {
            // Heuristic for zombie appointments: try to find a phone in the reason field
            const phoneMatch = appt.reason?.match(/\d{9,13}/);
            if (phoneMatch) {
                phone = phoneMatch[0];
            } else {
                showMessage("No phone number available. Please adjust/sync the appointment first.", "error");
                return;
            }
        }

        const dateStr = new Date(appt.appointment_date).toLocaleDateString();
        const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        const isVirtual = appt.type === 'virtual';
        let messageTemplate = isVirtual ? settings.appointment_reminder_virtual_template : settings.appointment_reminder_template;

        if (!messageTemplate || !messageTemplate.trim()) {
            messageTemplate = isVirtual
                ? `Hola {patient_name}, te recordamos tu turno VIRTUAL para el día {date} a las {time} con el/la Dr/a. {doctor_name}.`
                : `Hola {patient_name}, te recordamos tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name} en {appointment_location}. Por favor confirma asistencia.`;
        }

        const doctor = doctors.find(d => d.id === appt.doctor_id);
        const apptPrice = isVirtual ? (doctor?.virtual_consultation_price || 0) : (doctor?.consultation_price || 0);
        const address = isVirtual ? 'Virtual (Minutos antes enviaremos el link)' : (settings.clinic_address || 'Montiel 1255');

        const message = messageTemplate
            .replace(/{patient_name}/g, appt.patient_name || appt.reason)
            .replace(/{date}/g, dateStr)
            .replace(/{time}/g, timeStr)
            .replace(/{doctor_name}/g, appt.doctor_name)
            .replace(/{appointment_type}/g, isVirtual ? 'VIRTUAL' : 'PRESENCIAL')
            .replace(/{appointment_location}/g, address)
            .replace(/{price}/g, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(apptPrice))
            .replace(/{secretary_name}/g, user.name || 'Secretaria');

        // Copy to clipboard
        copyToClipboard(message).then(() => {
            showMessage("Texto copiado! Abriendo WhatsApp...", "success");

            phone = phone.replace(/\D/g, '');
            if (!phone.startsWith('54') && phone.length >= 10) {
                phone = '549' + phone;
            }

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                // Mobile: Always use wa.me which handles app/web redirect automatically
                window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            } else {
                // Desktop: Priority 'ZapZap' (Native App) -> Then Web
                const appUrl = phone
                    ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`
                    : `whatsapp://send?text=${encodeURIComponent(message)}`;

                const webUrl = phone
                    ? `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
                    : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;

                // 1. Try to open App
                window.location.href = appUrl;

                // 2. Fallback to Web if App doesn't capture it (simple timeout-based fallback)
                // We increase timeout to 2.5s to give the user time to say 'Open' if prompted
                setTimeout(() => {
                    window.open(webUrl, '_blank');
                }, 2500);
            }
        });
    };

    if (loading) return <div>{t('loading')}</div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {rescheduleAppt && (
                    <div className="reschedule-banner-container">
                        <div>
                            🚀 {t('rescheduling_mode')}: <strong>{rescheduleAppt.patient_name}</strong>. {t('reschedule_instruction')}
                        </div>
                        <button className="reschedule-exit-btn" onClick={exitRescheduleMode}>
                            {t('exit_reschedule')}
                        </button>
                    </div>
                )}

                {/* Primary Navigation Tabs - Always at the top */}
                <div className="top-nav-tabs mb-6">
                    <div className="tabs-container" style={{ margin: 0 }}>
                        <button
                            className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                            onClick={() => setActiveTab('calendar')}
                        >
                            📅 {t('calendar') || 'Agenda'}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            📋 {t('upcoming_appointments') || 'Próximos Turnos'}
                        </button>
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <button
                                className={`tab-btn ${activeTab === 'holidays' ? 'active' : ''}`}
                                onClick={() => setActiveTab('holidays')}
                            >
                                🏖️ {t('holidays') || 'Feriados'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-header con Acciones y Filtro de Médico */}
                <div className={`header-actions-container mb-8 ${viewDoctorId ? `doctor-color-${Number(viewDoctorId) % 10} doctor-themed-bg` : ''}`} style={viewDoctorId ? { borderRadius: '1rem', padding: '1rem 1.5rem' } : {}}>
                    <div className="action-bar-buttons-container">
                        <button
                            className={`btn ${showForm ? 'btn-secondary' : viewDoctorId ? 'd-accent' : 'btn-primary'}`}
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? <span>❌ Cancelar</span> : <span>✨ Nuevo Turno</span>}
                        </button>
                        <button className="btn btn-outline-primary btn-sm-icon" onClick={() => {
                            setSlotHistory([]);
                            setCurrentSlotParams(null);
                            handleNextFreeSlot(null);
                        }} title="Próximo turno libre">
                            <span>🔍</span> Próximo Libre
                        </button>
                    </div>

                    {(activeTab === 'calendar' || activeTab === 'upcoming') && user.role === 'secretary' && (
                        <div className="tabs-container" style={{ margin: 0, padding: '0.25rem' }}>
                            <button
                                className={`tab-btn-small ${!viewDoctorId ? 'active' : ''}`}
                                onClick={() => setViewDoctorId('')}
                            >
                                🏢 Todos
                            </button>
                            {doctors.map(d => (
                                <button
                                    key={d.id}
                                    className={`tab-btn-small ${viewDoctorId == d.id ? 'active' : ''}`}
                                    onClick={() => setViewDoctorId(d.id)}
                                    title={d.specialty}
                                >
                                    👨‍⚕️ {d.full_name.split(' ').slice(0, 2).join(' ')}
                                </button>
                            ))}
                        </div>
                    )}
                </div>



                {message && <div className={`alert-box ${message.includes('Failed') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

                {/* Calendar Layout */}
                {searchPatientId ? (
                    /* PATIENT APPOINTMENT LIST VIEW */
                    <div className="patient-history-view animate-fade-in card p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-main-700">
                                {t('results_for')}: {patientAppointments[0]?.patient_name || t('patient')}
                            </h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSearchPatientId('')}>
                                🔙 {t('back_to_calendar')}
                            </button>
                        </div>

                        {patientApptLoading ? <p>Cargando...</p> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Future Appointments */}
                                <div className="card bg-blue-50/50 border-blue-100">
                                    <h3 className="mb-4 text-blue-600 font-bold border-b border-blue-200 pb-2">📅 {t('upcoming_appointments')}</h3>
                                    {patientAppointments.filter(a => new Date(a.appointment_date) >= new Date()).length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-main-500 text-lg mb-4">
                                                {t('no_patient_history')}
                                            </p>
                                            <p className="text-sm text-blue-600 mb-2 font-medium">
                                                {t('create_one_now')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {patientAppointments.filter(a => new Date(a.appointment_date) >= new Date()).map(appt => (
                                                <div key={appt.id} className="p-3 bg-white border border-blue-100 rounded-lg shadow-sm flex flex-col gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="font-bold text-main-800">{new Date(appt.appointment_date).toLocaleDateString()} {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            <div className="text-main-600 text-sm">Dr. {appt.doctor_name}</div>
                                                            <div className="text-xs text-main-500 italic">{appt.reason}</div>
                                                        </div>
                                                        <span className={`tag tag-${appt.status === 'confirmed' ? 'green' : 'amber'}`}>
                                                            {t(appt.status)}
                                                        </span>
                                                    </div>
                                                    {/* [NEW] Go To Appointment Button */}
                                                    <button
                                                        className="btn btn-sm btn-outline-primary w-full flex items-center justify-center gap-2 mt-1"
                                                        onClick={() => {
                                                            const apptDate = new Date(appt.appointment_date);
                                                            // Correct timezone issue locally
                                                            const offset = apptDate.getTimezoneOffset() * 60000;
                                                            const localDate = new Date(apptDate.getTime() + offset);

                                                            setSelectedDate(localDate);
                                                            setViewDoctorId(appt.doctor_id);
                                                            setSearchPatientId(''); // Clear search to go to calendar
                                                        }}
                                                    >
                                                        ➡️ Ir al Turno
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        className="btn btn-primary mt-4 w-full"
                                        onClick={() => {
                                            setSelectedPatient(searchPatientId);
                                            setShowForm(true);
                                        }}
                                    >
                                        + {t('new_appointment') || 'Nuevo Turno'}
                                    </button>
                                </div>

                                {/* Past History */}
                                <div>
                                    <h3 className="mb-4 text-main-600 font-bold border-b pb-2">📜 {t('history')}</h3>
                                    {patientAppointments.filter(a => new Date(a.appointment_date) < new Date()).length === 0 ? (
                                        <p className="text-muted italic text-sm">{t('no_history')}</p>
                                    ) : (
                                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                            {patientAppointments.filter(a => new Date(a.appointment_date) < new Date()).map(appt => (
                                                <div key={appt.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg hover:shadow-md transition-all">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-semibold text-main-700">{new Date(appt.appointment_date).toLocaleDateString()}</span>
                                                        <span className={`text-xs uppercase font-bold text-${appt.status === 'completed' ? 'green-600' : 'slate-500'}`}>
                                                            {t(appt.status)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-main-600 mb-2">Dr. {appt.doctor_name}</div>
                                                    <div className="text-sm italic text-main-500 mb-3">"{appt.reason}"</div>

                                                    <div className="flex gap-2 justify-end border-t border-slate-200 pt-2">
                                                        <button
                                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                                            onClick={() => {
                                                                setSelectedPatient(searchPatientId);
                                                                setReason(appt.reason); // Pre-fill reason
                                                                setShowForm(true);
                                                            }}
                                                            title={t('repeat_appointment')}
                                                        >
                                                            🔄 {t('repeat_appointment')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                ) : activeTab === 'upcoming' ? (
                    <div className="upcoming-list-view animate-in">
                        <section className="card p-0 overflow-hidden border-slate-200 shadow-sm transition-all">
                            {loading ? <div className="p-8 text-center text-muted">{t('loading')}</div> : (
                                filteredAppointments.filter(a => new Date(a.appointment_date) >= new Date().setHours(0, 0, 0, 0)).length === 0 ?
                                    <div className="text-center p-12 bg-white">
                                        <p className="text-muted m-0">{t('no_upcoming_appointments') || 'No hay próximos turnos.'}</p>
                                    </div> :
                                    <div className="flex flex-col gap-2 p-4">
                                        {filteredAppointments
                                            .filter(a => new Date(a.appointment_date) >= new Date().setHours(0, 0, 0, 0))
                                            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                                            .map((a, index, arr) => {
                                                const dateObj = new Date(a.appointment_date);
                                                const dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                                                const isToday = dateObj.toLocaleDateString() === new Date().toLocaleDateString();
                                                const headerDate = isToday ? `Hoy, ${dateStr}` : dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

                                                const prevDateObj = index > 0 ? new Date(arr[index - 1].appointment_date) : null;
                                                const prevDateStr = prevDateObj ? prevDateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : null;
                                                const showHeader = index === 0 || dateStr !== prevDateStr;

                                                return (
                                                    <Fragment key={a.id}>
                                                        {showHeader && (
                                                            <div className="flex items-center gap-3 mt-4 mb-2 first:mt-0">
                                                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                                                                    {headerDate}
                                                                </span>
                                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-100 to-transparent"></div>
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`appointment-card group status-${a.status} ${a.source === 'google-incomplete' || a.source === 'google' ? 'status-external' : ''}`}
                                                            onClick={() => setActionModal({ open: true, appt: a })}
                                                            style={a.source === 'google-incomplete' || a.source === 'google' || a.status === 'external' ? { borderLeft: '4px solid var(--amber-500)' } : {}}
                                                        >
                                                            {/* Col 1: Time */}
                                                            <div className="appt-time-box">
                                                                <span className="text-sm font-bold text-main-900">
                                                                    {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                                </span>
                                                            </div>

                                                            {/* Col 2: Patient Info */}
                                                            <div className="appt-info">
                                                                <div className="font-bold text-main-800 truncate">{a.patient_name}</div>
                                                                {a.patient_phone && (
                                                                    <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                                                        📱 {a.patient_phone}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2 text-[11px] text-muted truncate">
                                                                    <span className="flex items-center gap-1">👨‍⚕️ {a.doctor_name}</span>
                                                                    {a.reason && <span className="italic opacity-75 truncate">• {a.reason}</span>}
                                                                </div>
                                                            </div>

                                                            {/* Col 3: Status Chips */}
                                                            <div className="appt-status">
                                                                {a.payment_status === 'paid' && <span title="Paid" className="text-emerald-500 font-bold text-xs">$✓</span>}
                                                                {a.payment_status === 'debt' && <span title="Debt" className="text-rose-500 font-bold text-xs">$!</span>}

                                                                <span className={`status-chip-mini status-${a.status} inline-block`}>
                                                                    {t(a.status) || a.status}
                                                                </span>
                                                            </div>

                                                            {/* Col 4: Action Button */}
                                                            <div className="appt-actions">
                                                                <button onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleWhatsAppConfirm(a);
                                                                }}
                                                                    className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100"
                                                                    title="WhatsApp"
                                                                >
                                                                    📲
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </Fragment>
                                                );
                                            })}
                                    </div>
                            )}
                        </section>
                    </div>
                ) : (
                    <div className="appointments-tab-content">
                        <div className="appointments-grid">
                            <div className="calendar-section">
                                {activeTab === 'calendar' ? (
                                    <Calendar
                                        selectedDate={selectedDate}
                                        onDateSelect={handleDateSelect}
                                        appointments={filteredAppointments}
                                        holidays={holidays}
                                    />
                                ) : (
                                    <div className="card h-full animate-in">
                                        <h3 className="config-section-title">🏖️ Agregar Feriado</h3>
                                        <p className="text-sm text-muted mb-6">
                                            Bloquea días específicos en la agenda.
                                        </p>
                                        <HolidayForm onHolidaysChanged={fetchHolidays} />
                                    </div>
                                )}
                            </div>
                            <div className={`schedule-section-container ${viewDoctorId ? `doctor-color-${Number(viewDoctorId) % 10}` : ''}`}>
                                {activeTab === 'calendar' ? (
                                    <div className={viewDoctorId ? "doctor-themed-bg p-4 rounded-2xl border" : ""}>
                                        <div className="schedule-header-search mb-4">
                                            <div className="filter-group patient-search-container">
                                                <label className={`filter-label ${viewDoctorId ? 'doctor-themed-text' : ''}`}>Buscar Historial de Paciente</label>
                                                <PatientSearchSelect
                                                    value={searchPatientId}
                                                    placeholder="🔍 Buscar por Nombre/DNI..."
                                                    onChange={(val) => setSearchPatientId(val)}
                                                    onCreatePatient={() => {
                                                        setSelectedPatientData(null);
                                                        setEditPatientModalOpen(true);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <DaySchedule
                                            date={selectedDate}
                                            appointments={currentDoctor ? filteredAppointments.filter(a => a.doctor_id === currentDoctor.id) : filteredAppointments}
                                            onSlotClick={handleSlotClick}
                                            onRatingChange={handleRatingChange}
                                            doctor={currentDoctor}
                                            schedule={doctorSchedule}
                                            onWhatsAppConfirm={handleWhatsAppConfirm}
                                        />
                                    </div>
                                ) : (
                                    <div className="card h-full animate-in overflow-hidden flex flex-col">
                                        <h3 className="config-section-title">📋 Lista de Días Cerrados</h3>
                                        <div className="flex-1 overflow-y-auto pr-2">
                                            <HolidayList holidays={holidays} onHolidaysChanged={fetchHolidays} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <Modal
                    isOpen={showForm}
                    onClose={() => {
                        setShowForm(false);
                        setSyncReferenceInfo(null);
                        setSyncingZombieId(null);
                    }}
                    title={t('new_appointment')}
                >
                    <form onSubmit={handleBook} id="new-appointment-form" autoComplete="off">
                        {/* Fake fields to stop Chrome Autosave */}
                        <div className="visually-hidden">
                            <input type="text" name="fake_user_trap_appt" autoComplete="username" tabIndex={-1} />
                            <input type="password" name="fake_pass_trap_appt" autoComplete="new-password" tabIndex={-1} />
                        </div>
                        {syncReferenceInfo && (
                            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-top-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">📄 Información Original (Referencia)</span>
                                <div className="text-sm font-bold text-amber-900 leading-tight">
                                    {syncReferenceInfo}
                                </div>
                                <p className="text-[11px] text-amber-700 italic">
                                    Utilice esta información para buscar al paciente correcto.
                                </p>
                            </div>
                        )}
                        <div className="input-group">
                            <label className="input-label">{t('doctors')}</label>
                            {user.role === 'doctor' ? (
                                <div className="input-field input-read-only">
                                    {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'You'}
                                </div>
                            ) : (
                                <select className="input-field" value={selectedDoctor || ''} onChange={e => setSelectedDoctor(e.target.value)} required>
                                    <option value="">{t('select_doctor')}</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Tipo de Turno</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${type === 'consultation' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setType('consultation')}
                                >
                                    🏢 Presencial
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${type === 'virtual' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setType('virtual')}
                                >
                                    📹 Videollamada
                                </button>
                            </div>
                        </div>

                        {(user.role === 'secretary' || user.role === 'doctor') && (
                            <div className="input-group">
                                <label className="input-label">{t('patients')}</label>
                                <PatientSearchSelect
                                    value={selectedPatient}
                                    autoFocus={true}
                                    placeholder={t('select_patient')}
                                    onCreatePatient={async (name) => {
                                        // Open Create Patient Modal with pre-filled name
                                        // We need to set state to open the modal
                                        // Ensure PatientEditModal is ready for creation (usually patient=null or {full_name: name})
                                        setSelectedPatientData({ full_name: name }); // Pre-fill name if supported by modal
                                        setEditPatientModalOpen(true);
                                    }}
                                    onChange={(val, obj) => {
                                        setSelectedPatient(val);
                                        setSelectedPatientData(obj);

                                        // Specific Check
                                        if (obj) {
                                            const missing = [];
                                            if (!obj.dni) missing.push(t('dni') || 'DNI');
                                            if (!obj.phone) missing.push(t('phone') || 'Teléfono');
                                            if (!obj.email) missing.push('Email');
                                            if (!obj.address) missing.push(t('address') || 'Dirección');
                                            if (!obj.insurance_name && !obj.insurance && !obj.insurance_id) missing.push('Obra Social');

                                            setMissingData(missing);
                                        } else {
                                            setMissingData([]);
                                        }
                                    }}
                                />
                                {missingData.length > 0 && (
                                    <div className="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded border border-yellow-200 flex flex-between items-center">
                                        <span>
                                            ⚠️ <strong>Datos incompletos:</strong> {missingData.join(', ')}.
                                        </span>
                                        <button
                                            type="button"
                                            className="ml-2 text-blue-600 underline font-bold"
                                            onClick={() => setEditPatientModalOpen(true)}
                                        >
                                            Completar
                                        </button>
                                    </div>
                                )}

                                {selectedPatientData?.phone && (
                                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">📱 Teléfono Contacto</span>
                                            <span className="text-sm font-bold text-emerald-900">{selectedPatientData.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-white px-2 py-1 rounded-full shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            WHATSAPP OK
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">{t('date_time')}</label>
                            <input type="datetime-local" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">{t('appointment_type') || 'Tipo de Consulta'}</label>
                            <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
                                <option value="consultation">{t('presencial') || 'Presencial (Consultorio)'}</option>
                                <option value="virtual">{t('virtual') || 'Virtual (Remoto)'}</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">{t('reason')}</label>
                            <textarea className="input-field" rows="3" value={reason} onChange={e => setReason(e.target.value)} required></textarea>
                        </div>

                        <div className="input-group checkbox-group">
                            <input
                                type="checkbox"
                                id="bonified"
                                checked={bonified}
                                onChange={e => setBonified(e.target.checked)}
                                className="w-auto"
                            />
                            <label htmlFor="bonified" className="input-label checkbox-label">
                                {t('bonificado') || 'Bonificado (Free/Waived)'}
                            </label>
                        </div>
                        <div className="mt-4 text-right">
                            <button type="submit" className="btn btn-accent w-full">{t('confirm_booking')}</button>
                        </div>
                    </form>
                </Modal>

                <TransactionModal
                    isOpen={paymentModal.open}
                    onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                    initialData={paymentModal.initialData}
                    onSuccess={async (data) => {
                        if (paymentModal.apptId) {
                            try {
                                await api.patch(`/appointments/${paymentModal.apptId}/payment`, { status: data.status });
                                fetchAppointments();
                            } catch (e) { console.error(e); }
                        }
                    }}
                />

                {/* Action Modal for Appointment */}
                {
                    actionModal.open && actionModal.appt && (
                        <Modal
                            isOpen={actionModal.open}
                            onClose={() => setActionModal({ ...actionModal, open: false })}
                            title={`Appointment: ${actionModal.appt.patient_name || actionModal.appt.reason || 'Sincronización requerida'}`}
                        >
                            <div className="flex-col-gap-4">
                                <div className="flex-between">
                                    <p><strong>{t('patient_label') || 'Paciente'}:</strong> {actionModal.appt.patient_name || actionModal.appt.reason || 'Sincronización requerida'}</p>
                                    {actionModal.appt.patient_phone && (
                                        <p className="flex items-center gap-2 text-blue-600">
                                            <strong>{t('phone') || 'Teléfono'}:</strong>
                                            <span className="font-mono">{actionModal.appt.patient_phone}</span>
                                            <button
                                                className="btn-icon-small hover:bg-blue-100 rounded-full p-1 transition-colors"
                                                onClick={() => copyToClipboard(actionModal.appt.patient_phone).then(() => showMessage("Teléfono copiado", "success"))}
                                                title="Copiar"
                                            >
                                                📋
                                            </button>
                                        </p>
                                    )}
                                    <p><strong>{t('date_label')}:</strong> {new Date(actionModal.appt.appointment_date).toLocaleString()}</p>
                                    <div className="flex gap-2">
                                        <span className={`status-chip status-${actionModal.appt.status}`}>
                                            {t(actionModal.appt.status) || actionModal.appt.status}
                                        </span>
                                        <span className={`status-badge-wrapper badge-${actionModal.appt.payment_status === 'paid' ? 'green' : 'red'}`}>
                                            {t(actionModal.appt.payment_status) || actionModal.appt.payment_status}
                                        </span>
                                    </div>
                                </div>
                                <p><strong>{t('reason')}:</strong> {actionModal.appt.reason || t('no_description') || 'No description'}</p>
                                <hr className="border-divider" />
                                <hr className="border-divider" />

                                {/* Doctor Workflow Panel (Synced with Dashboard.jsx) */}
                                {user.role === 'doctor' && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 mb-2">
                                        <h4 className="text-xs font-bold text-main-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                                            👨‍⚕️ {t('medical_panel') || 'Panel Médico'}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <button
                                                className="btn btn-primary btn-sm flex items-center justify-center gap-2"
                                                onClick={() => {
                                                    setHistoryModal({
                                                        open: true,
                                                        patientId: actionModal.appt.patient_id,
                                                        patientName: actionModal.appt.patient_name
                                                    });
                                                    setActionModal({ ...actionModal, open: false });
                                                }}
                                            >
                                                🩺 {t('view_history') || 'Ver H. Clínica'}
                                            </button>
                                            <button
                                                className="btn btn-accent btn-sm flex items-center justify-center gap-2"
                                                onClick={() => {
                                                    setPrescribeModal({
                                                        open: true,
                                                        apptId: actionModal.appt.id,
                                                        patientName: actionModal.appt.patient_name,
                                                        medications: '',
                                                        instructions: ''
                                                    });
                                                    setActionModal(prev => ({ ...prev, open: false }));
                                                }}
                                            >
                                                💊 {t('prescribe') || 'Recetar'}
                                            </button>
                                            <button
                                                className="btn btn-status-complete btn-sm flex items-center justify-center gap-2 col-span-2"
                                                onClick={async () => {
                                                    if (await confirm(t('confirm_attended') || 'Mark as Attended/Completed?')) {
                                                        handleUpdateStatus(actionModal.appt.id, 'completed');
                                                        setActionModal(prev => ({ ...prev, open: false }));
                                                    }
                                                }}
                                            >
                                                ✅ {t('attended') || 'Atendido'}
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="input-field text-sm py-1"
                                                placeholder={t('evolution_note_placeholder') || "Nota de evolución / Razón..."}
                                                defaultValue={actionModal.appt.reason || ''}
                                                id="quick-evolution-note-appt"
                                            />
                                            <button
                                                className="btn btn-secondary btn-sm px-3"
                                                title={t('save_note') || "Guardar Nota"}
                                                onClick={async () => {
                                                    const note = document.getElementById('quick-evolution-note-appt').value;
                                                    try {
                                                        await api.put(`/appointments/${actionModal.appt.id}`, {
                                                            reason: note,
                                                            appointment_date: actionModal.appt.appointment_date
                                                        });
                                                        showMessage(t('note_saved') || 'Nota actualizada', 'success');
                                                        setActionModal(prev => ({
                                                            ...prev,
                                                            appt: { ...prev.appt, reason: note }
                                                        }));
                                                        fetchAppointments();
                                                    } catch (e) { console.error(e); }
                                                }}
                                            >
                                                💾
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <hr className="border-divider" />

                                {/* Sync Needed / Adjustment Action - Outside role check for visibility */}
                                {(actionModal.appt.source === 'google' || actionModal.appt.source === 'google-incomplete') && (
                                    <button
                                        className="btn btn-accent w-full py-4 mb-4"
                                        onClick={() => handleSyncGoogleEvent(actionModal.appt)}
                                        style={{ background: 'linear-gradient(135deg, var(--amber-500) 0%, var(--orange-600) 100%)', border: 'none', color: 'white' }}
                                    >
                                        ✨ Ingresar Ajuste (Sincronizar BBDD)
                                    </button>
                                )}

                                {/* ADMINISTRATIVE ACTIONS (Secretary/Admin Only) */}
                                {(user.role === 'secretary' || user.role === 'admin') && (
                                    <>
                                        <div className="grid-2-cols">
                                            {/* Pay Button */}
                                            {(actionModal.appt.payment_status === 'pending' || actionModal.appt.payment_status === 'debt') && actionModal.appt.source !== 'google' && actionModal.appt.source !== 'google-incomplete' && (
                                                <button className="btn btn-primary" onClick={() => {
                                                    setPaymentModal({
                                                        open: true,
                                                        initialData: {
                                                            type: 'income_patient',
                                                            amount: actionModal.appt.cost || 0,
                                                            patientId: actionModal.appt.patient_id,
                                                            patientName: actionModal.appt.patient_name,
                                                            patientDni: actionModal.appt.patient_dni,
                                                            patientUserId: actionModal.appt.patient_user_id,
                                                            doctorId: actionModal.appt.doctor_id,
                                                            description: `Payment for appointment on ${new Date(actionModal.appt.appointment_date).toLocaleDateString()}`,
                                                            serviceType: actionModal.appt.type === 'virtual' ? 'virtual_consultation' : 'consultation',
                                                            appointmentType: actionModal.appt.type,
                                                            apptId: actionModal.appt.id
                                                        },
                                                        apptId: actionModal.appt.id
                                                    });
                                                    setActionModal({ ...actionModal, open: false });
                                                }}>
                                                    💳 {t('pay')}
                                                </button>
                                            )}


                                            {/* Actions - Hide if Completed (Unless Unrestricted CRUD enabled AND NOT paid) */}
                                            {(actionModal.appt.status !== 'completed' || (settings.enable_secretary_unrestricted_crud === 'true' && actionModal.appt.payment_status !== 'paid')) && actionModal.appt.source !== 'google' && actionModal.appt.source !== 'google-incomplete' && (
                                                <>
                                                    {/* Arrived Button (Hide for virtual) */}
                                                    {actionModal.appt.status !== 'arrived' && actionModal.appt.type !== 'virtual' && (
                                                        <button className="btn btn-primary" onClick={() => {
                                                            handleUpdateStatus(actionModal.appt.id, 'arrived');
                                                            setActionModal({ ...actionModal, open: false });
                                                        }}>
                                                            🏥 {t('patient_arrived') || 'Asistió (En Sala)'}
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {/* Reschedule and Status buttons - logic split to be clearer */}
                                            {(actionModal.appt.status !== 'completed' || (settings.enable_secretary_unrestricted_crud === 'true' && actionModal.appt.payment_status !== 'paid')) && actionModal.appt.source !== 'google' && actionModal.appt.source !== 'google-incomplete' && (
                                                <>
                                                    {/* Reschedule Button */}
                                                    <button className="btn btn-secondary" onClick={() => {
                                                        navigate('/appointments', { state: { rescheduleAppt: actionModal.appt } });
                                                        setActionModal({ ...actionModal, open: false });
                                                    }}>
                                                        📅 {t('reschedule')}
                                                    </button>

                                                    {/* Action Buttons for Status */}
                                                    {actionModal.appt.status === 'pending' && (
                                                        <button className="btn btn-status-confirm" onClick={() => {
                                                            handleUpdateStatus(actionModal.appt.id, 'confirmed');
                                                            setActionModal({ ...actionModal, open: false });
                                                        }}>
                                                            ✅ {t('confirm')}
                                                        </button>
                                                    )}

                                                    {(actionModal.appt.status === 'confirmed' || actionModal.appt.status === 'pending' || actionModal.appt.status === 'rescheduled' || actionModal.appt.status === 'arrived') && (
                                                        <button className="btn btn-status-complete" onClick={() => {
                                                            handleUpdateStatus(actionModal.appt.id, 'completed');
                                                            setActionModal({ ...actionModal, open: false });
                                                        }}>
                                                            🏆 {t('attended') || 'Atendido'}
                                                        </button>
                                                    )}

                                                    <button className="btn btn-status-suspend" onClick={() => {
                                                        handleUpdateStatus(actionModal.appt.id, 'suspended');
                                                        setActionModal({ ...actionModal, open: false });
                                                    }}>
                                                        ⏸ {t('suspend')}
                                                    </button>

                                                    <button className="btn btn-status-absent" onClick={() => {
                                                        handleUpdateStatus(actionModal.appt.id, 'absent');
                                                        setActionModal({ ...actionModal, open: false });
                                                    }}>
                                                        🚫 {t('absent')}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <hr className="border-divider" />

                                        {/* Cancel/Delete - Hide if Completed (Unless Unrestricted CRUD enabled AND NOT paid) */}
                                        {(actionModal.appt.status !== 'completed' || (settings.enable_secretary_unrestricted_crud === 'true' && actionModal.appt.payment_status !== 'paid')) && (
                                            <div className="grid-2-cols">
                                                {/* Cancel (Standard) */}
                                                {actionModal.appt.source !== 'google' && actionModal.appt.source !== 'google-incomplete' && (
                                                    <button className="btn btn-outline-danger" onClick={() => {
                                                        handleCancel(actionModal.appt.id);
                                                        setActionModal({ ...actionModal, open: false });
                                                    }}>
                                                        ❌ {t('cancel')}
                                                    </button>
                                                )}

                                                {/* Delete (Error) - Admin/Secretary */}
                                                {(user.role === 'admin' || user.role === 'secretary') && (
                                                    <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => {
                                                        handleDelete(actionModal.appt.id, actionModal.appt.status);
                                                        setActionModal({ ...actionModal, open: false });
                                                    }}>
                                                        🗑 {t('delete_error')}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </Modal>
                    )
                }




                <Modal
                    isOpen={prescribeModal.open}
                    onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                    title={`${t('prescription_for') || 'Receta para'} ${prescribeModal.patientName}`}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setPrescribeModal({ ...prescribeModal, open: false })}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSavePrescription} disabled={!prescribeModal.medications.trim()}>{t('create')}</button>
                        </>
                    }
                >
                    <div className="flex-col-gap-4">
                        <div className="input-group">
                            <label className="input-label">{t('medications')}</label>
                            <MedicationAutocomplete
                                value=""
                                onChange={() => { }}
                                placeholder={t('search_medication') || "Buscar medicamento..."}
                                onSelectMedication={(med) => {
                                    const current = prescribeModal.medications.trim();
                                    const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
                                    setPrescribeModal({ ...prescribeModal, medications: newValue });
                                }}
                            />
                            <textarea
                                className="input-field mt-2"
                                rows="4"
                                value={prescribeModal.medications}
                                onChange={e => setPrescribeModal({ ...prescribeModal, medications: e.target.value })}
                                placeholder={t('meds_placeholder') || "ej. Ibuprofeno 600mg"}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('instructions')}</label>
                            <textarea className="input-field" rows="3" value={prescribeModal.instructions} onChange={e => setPrescribeModal({ ...prescribeModal, instructions: e.target.value })} placeholder={t('instructions_placeholder') || "ej. Tomar cada 8 horas con comida."} />
                        </div>
                    </div>
                </Modal>

                <PatientHistoryModal
                    isOpen={historyModal.open}
                    onClose={() => setHistoryModal({ ...historyModal, open: false })}
                    patientId={historyModal.patientId}
                    patientName={historyModal.patientName}
                />

                <Modal
                    isOpen={whatsappModal.open}
                    onClose={() => setWhatsappModal({ ...whatsappModal, open: false })}
                    title="Enviar Confirmación por WhatsApp"
                    size="md"
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setWhatsappModal({ ...whatsappModal, open: false })}>{t('cancel')}</button>
                            <button
                                className="btn btn-emerald text-white"
                                onClick={() => {
                                    const message = whatsappModal.message;
                                    let phone = whatsappModal.phone.replace(/\D/g, '');

                                    // Standardize AR phones if needed (optional but good consistency)
                                    if (!phone.startsWith('54') && phone.length >= 10) {
                                        phone = '549' + phone;
                                    }

                                    const encodedText = encodeURIComponent(message);

                                    // Copy to clipboard for safety
                                    navigator.clipboard.writeText(message).catch(err => console.error(err));

                                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                                    if (isMobile) {
                                        window.location.href = `https://wa.me/${phone}?text=${encodedText}`;
                                    } else {
                                        // Desktop: Try Protocol Handler (ZapZap) first
                                        const appUrl = `whatsapp://send?phone=${phone}&text=${encodedText}`;
                                        const webUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;

                                        // 1. Try to open App
                                        window.location.href = appUrl;

                                        // 2. Fallback to Web
                                        setTimeout(() => {
                                            window.open(webUrl, '_blank');
                                        }, 2500);
                                    }

                                    setWhatsappModal({ ...whatsappModal, open: false });
                                    showMessage("Mensaje copiado. Abriendo WhatsApp...", "success");
                                }}
                            >
                                📲 Enviar Mensaje (ZapZap)
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">📱</div>
                            <div>
                                <p className="text-sm text-emerald-900 font-bold">Enviar a: {whatsappModal.phone}</p>
                                <p className="text-xs text-emerald-700">El mensaje se abrirá en WhatsApp Desktop/Web.</p>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Mensaje a enviar</label>
                            <textarea
                                className="input-field min-h-[120px]"
                                value={whatsappModal.message}
                                onChange={(e) => setWhatsappModal({ ...whatsappModal, message: e.target.value })}
                            ></textarea>
                        </div>
                    </div>
                </Modal>

                <Modal
                    isOpen={showNextSlotModal}
                    onClose={() => setShowNextSlotModal(false)}
                    title="🔍 Búsqueda de Turnos Libres"
                    size="lg"
                >
                    <div className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar p-2">
                        {!nextSlotData?.results ? (
                            <div className="text-center p-12 text-main-500 flex flex-col items-center gap-3">
                                <div className="loading-spinner-small"></div>
                                <p className="font-medium">Explorando agenda en busca de huecos...</p>
                            </div>
                        ) : (
                            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Horario / Fecha</th>
                                            <th className="px-5 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(() => {
                                            let lastMonth = '';
                                            const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
                                            const todayIso = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).split(' ')[0];

                                            return nextSlotData.results.map((day, dayIndex) => {
                                                const [y, m, d] = day.date.split('-');
                                                const isToday = day.date === todayIso;
                                                const monthLabel = `${monthNames[parseInt(m) - 1]} ${y}`;

                                                const showMonthHeader = monthLabel !== lastMonth;
                                                if (showMonthHeader) lastMonth = monthLabel;

                                                return (
                                                    <Fragment key={day.date}>
                                                        {showMonthHeader && (
                                                            <tr className="bg-slate-900 border-y border-slate-800">
                                                                <td colSpan="2" className="px-5 py-2 text-center">
                                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                                                        🗓️ {monthLabel}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="bg-slate-50/80">
                                                            <td colSpan="2" className="px-5 py-2 border-b border-slate-100">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black text-main-600 uppercase tracking-widest">
                                                                        📅 {day.dayName}
                                                                    </span>
                                                                    {isToday && (
                                                                        <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">HOY</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {day.slots.map((slot, i) => (
                                                            <tr key={`${day.date}-${i}`} className="group hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-5 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-black text-main-900 leading-none">
                                                                            {slot.time}
                                                                        </span>
                                                                        {slot.is_break && (
                                                                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase border border-amber-200">EXT</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-3">
                                                                        <button
                                                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all border border-green-100 shadow-sm"
                                                                            onClick={(e) => { e.stopPropagation(); handleWhatsAppSlot({ ...slot, dayName: day.dayName }); }}
                                                                            title="Compartir por WhatsApp"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2001/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-md active:scale-95"
                                                                            onClick={() => confirmNextSlot(slot.iso)}
                                                                        >
                                                                            Seleccionar
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </Fragment>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-4 px-2">
                            {slotHistory.length > 0 && (
                                <button
                                    className="flex-1 btn btn-secondary py-5 flex flex-col items-center gap-1 rounded-2xl border-2 hover:bg-slate-50 transition-all font-bold"
                                    onClick={() => {
                                        const prevDate = slotHistory[slotHistory.length - 1];
                                        setSlotHistory(prev => prev.slice(0, -1));
                                        setCurrentSlotParams(prevDate);
                                        handleNextFreeSlot(prevDate);
                                    }}
                                >
                                    <span className="text-xl">⬅️</span>
                                    <span className="text-xs uppercase tracking-widest text-muted">Anteriores</span>
                                </button>
                            )}
                            {nextSlotData?.nextStartDate && (
                                <button
                                    className="flex-[2] btn btn-secondary py-5 flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                                    onClick={() => {
                                        setSlotHistory(prev => [...prev, currentSlotParams]);
                                        setCurrentSlotParams(nextSlotData.nextStartDate);
                                        handleNextFreeSlot(nextSlotData.nextStartDate);
                                    }}
                                >
                                    <span className="text-xl group-hover:scale-125 transition-transform">🔍</span>
                                    <span className="text-xs uppercase tracking-widest font-black text-blue-600">Explorar más fechas</span>
                                </button>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-muted uppercase font-bold tracking-tighter">
                            <span>Use las flechas del teclado para navegar</span>
                            <button className="btn btn-sm btn-ghost" onClick={() => setShowNextSlotModal(false)}>Cerrar</button>
                        </div>
                    </div>
                </Modal>

                {
                    editPatientModalOpen && (
                        <PatientEditModal
                            isOpen={editPatientModalOpen}
                            onClose={() => setEditPatientModalOpen(false)}
                            patient={selectedPatientData}
                            referenceInfo={syncReferenceInfo}
                            onUpdate={(updatedData) => {
                                setSelectedPatient(updatedData.id); // [FIX] Auto-select the ID (crucial for form)
                                setSelectedPatientData(updatedData);

                                // Re-check missing
                                const missing = [];
                                if (!updatedData.dni) missing.push(t('dni') || 'DNI');
                                if (!updatedData.phone) missing.push(t('phone') || 'Teléfono');
                                if (!updatedData.email) missing.push('Email');
                                if (!updatedData.address) missing.push(t('address') || 'Dirección');
                                if (!updatedData.insurance_name && !updatedData.insurance && !updatedData.insurance_id) missing.push('Obra Social');
                                setMissingData(missing);
                            }}
                        />
                    )
                }
            </main >
        </div >
    );
};

const HolidayForm = ({ onHolidaysChanged }) => {
    const [newDate, setNewDate] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const { showMessage } = useMessage();

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/holidays', { date: newDate, description: newDesc });
            showMessage('Holiday added', 'success');
            setNewDate('');
            setNewDesc('');
            if (onHolidaysChanged) onHolidaysChanged();
        } catch (err) {
            showMessage(err.response?.data || 'Failed to add', 'error');
        }
    };

    return (
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="input-group">
                <label className="input-label">Fecha</label>
                <input type="date" className="input-field" value={newDate} onChange={e => setNewDate(e.target.value)} required />
            </div>
            <div className="input-group">
                <label className="input-label">Descripción</label>
                <input type="text" className="input-field" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ej. Navidad" required />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2">✨ Agregar Feriado</button>
        </form>
    );
};

const HolidayList = ({ holidays, onHolidaysChanged }) => {
    const { confirm } = useModal();

    const handleDelete = async (id) => {
        if (!await confirm("¿Eliminar este feriado?")) return;
        try {
            await api.delete(`/holidays/${id}`);
            if (onHolidaysChanged) onHolidaysChanged();
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return isoString.split('T')[0];
    };

    if (holidays.length === 0) {
        return (
            <div className="text-center py-12 text-muted italic bg-slate-50 rounded-xl border border-dashed">
                No hay feriados configurados.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holidays.map(h => (
                <div key={h.id} className="holiday-list-item">
                    <div>
                        <span className="font-bold text-main-800">{formatDate(h.date)}</span>
                        <div className="text-sm text-muted">{h.description}</div>
                    </div>
                    <button onClick={() => handleDelete(h.id)} className="btn-text-danger" title="Eliminar">
                        🗑️
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Appointments;

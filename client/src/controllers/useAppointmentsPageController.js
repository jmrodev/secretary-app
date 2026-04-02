
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../features/auth';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useConfig } from '../context/ConfigContext';

import { useAppointments } from '../hooks/useAppointments';
import { useHolidays } from '../hooks/useHolidays';
import { useNextFreeSlot } from '../hooks/useNextFreeSlot';
import { useAppointmentBooking } from '../hooks/useAppointmentBooking';
import { useWhatsAppUniversal } from '../hooks/useWhatsAppUniversal';
import { useGoogleEvents } from '../hooks/useGoogleEvents';
import { usePatientSearch } from '../hooks/usePatientSearch';
import { useAppointmentsHandlers } from '../hooks/useAppointmentsHandlers';
import { copyToClipboard } from '../utils/clipboardUtils';

export const useAppointmentsPageController = () => {
    // --- Contexts ---
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { confirm } = useModal();
    const navigate = useNavigate();
    const location = useLocation();

    // --- Local State ---
    const [viewDoctorId, setViewDoctorId] = useState(location.state?.viewDoctorId || localStorage.getItem('last_selected_doctor_id') || '');
    const [doctors, setDoctors] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date());
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'calendar');
    const [showOutOfHours, setShowOutOfHours] = useState(false);

    console.log("[Controller] selectedDate state:", selectedDate);

    // --- Modals State ---
    const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [retryAction, setRetryAction] = useState(null);
    const [calendarStats, setCalendarStats] = useState({});

    // --- Sub-Hooks ---
    const { updateStatus, updateAppointment, cancelAppointment, deleteAppointment, rescheduleAppointment, savePrescription } = useAppointments();
    const { holidays, addHoliday, deleteHoliday } = useHolidays();

    const patientSearch = usePatientSearch();
    const { searchTerm, setSearchTerm, searchPatientId, setSearchPatientId, appointments, setAppointments, patientAppointments, patientApptLoading, fetchAppointments } = patientSearch;

    const { doctorSchedule, syncDayToGoogle } = useGoogleEvents(viewDoctorId, selectedDate, user.role);
    const { handleWhatsAppUniversal } = useWhatsAppUniversal(doctors);

    const booking = useAppointmentBooking(doctors);
    const {
        selectedDoctor, setSelectedDoctor, setDate, setReason, setType,
        setShowForm, setBonified, setSelectedInstitution,
        setSyncingZombieId, setSyncReferenceInfo, bookAppointment,
        selectedPatientData, setSelectedPatientData, setSelectedPatient,
        whatsappModal, setWhatsappModal
    } = booking;

    const nextSlot = useNextFreeSlot(viewDoctorId || selectedDoctor);
    const {
        fetchNextFreeSlots, setSlotHistory, nextSlotData, showModal: showNextSlotModal, setShowModal: setShowNextSlotModal
    } = nextSlot;

    // --- Effects ---

    const fetchAllData = useCallback(async () => {
        await fetchAppointments();
        try {
            const [dRes, iRes] = await Promise.all([api.get('/users/doctors'), api.get('/institutions')]);
            setDoctors(dRes.data);
            setInstitutions(iRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [fetchAppointments]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    // Consolidated effect to sync viewDoctorId and selectedDoctor (prevents infinite loop)
    useEffect(() => {
        // Save to localStorage whenever either changes
        const doctorId = viewDoctorId || selectedDoctor;
        if (doctorId) {
            localStorage.setItem('last_selected_doctor_id', doctorId);
        }

        // Sync viewDoctorId -> selectedDoctor (only if selectedDoctor is empty)
        if (viewDoctorId && !selectedDoctor) {
            setSelectedDoctor(viewDoctorId);
        }

        // Sync selectedDoctor -> viewDoctorId (only if viewDoctorId is empty)
        if (selectedDoctor && !viewDoctorId) {
            setViewDoctorId(selectedDoctor);
        }
    }, [viewDoctorId, selectedDoctor]);

    useEffect(() => {
        if (!selectedDoctor || !booking.date) return;
        const updateType = async () => {
            try {
                let relevantSchedule = doctorSchedule;
                if (viewDoctorId != selectedDoctor) {
                    const res = await api.get(`/schedules/${selectedDoctor}`);
                    relevantSchedule = res.data;
                }
                if (!relevantSchedule?.length) return;
                const dateObj = new Date(booking.date.includes('T') ? booking.date : booking.date.replace(' ', 'T'));
                const config = relevantSchedule.find(s => s.day_of_week === dateObj.getDay());
                setType(config?.default_type || 'consultation');
            } catch (err) { console.error(err); }
        };
        updateType();
        updateType();
    }, [selectedDoctor, booking.date, doctorSchedule]);

    // Fetch Calendar Stats (Slots Count)
    useEffect(() => {
        if (!viewDoctorId) return;
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;

        const fetchStats = async () => {
            try {
                const res = await api.get(`/appointments/stats?year=${year}&month=${month}&doctor_id=${viewDoctorId}`);
                setCalendarStats(res.data);
            } catch (e) { console.error("Stats fetch error:", e); }
        };
        fetchStats();
    }, [viewDoctorId, selectedDate.getMonth(), selectedDate.getFullYear(), appointments.length]);

    const rescheduleAppt = location.state?.rescheduleAppt;
    const syncAppt = location.state?.syncAppt;
    const exitRescheduleMode = useCallback(() => {
        navigate(location.pathname, { replace: true, state: {} });
    }, [navigate, location.pathname]);

    // We can't move this effect to handlers easily as it runs on mount/update logic logic
    useEffect(() => {
        if (rescheduleAppt) { setViewDoctorId(rescheduleAppt.doctor_id); return; }
        if (syncAppt) {
            setViewDoctorId(syncAppt.doctor_id);
            setSelectedDate(new Date(syncAppt.appointment_date));
        }
        if (user.role === 'doctor' && doctors.length > 0) {
            const profile = doctors.find(d => d.user_id === (user.user_id || user.id));
            if (profile) setViewDoctorId(profile.id);
        }
    }, [user, doctors, rescheduleAppt, syncAppt]);


    // --- Derived Data ---
    const currentDoctor = viewDoctorId ? doctors.find(d => d.id === Number(viewDoctorId)) : null;

    const localFiltered = appointments.filter(app => {
        if (searchPatientId) return app.patient_id === Number(searchPatientId);
        if (viewDoctorId) return app.doctor_id === Number(viewDoctorId);
        return true;
    });

    const filteredAppointments = localFiltered.filter(app => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (app.patient_name || app.full_name || '').toLowerCase().includes(term) ||
            (app.reason || '').toLowerCase().includes(term) ||
            (app.patient_phone || '').toLowerCase().includes(term);
    });

    // --- Using the Handlers Hook ---
    // We pass EVERYTHING the handlers might need.
    const hookHandlers = useAppointmentsHandlers({
        user, t, showMessage, confirm, navigate,

        selectedDate, setSelectedDate,
        viewDoctorId, setViewDoctorId, selectedDoctor, setSelectedDoctor,
        rescheduleAppt, exitRescheduleMode,
        holidays, doctors, settings,
        appointments, filteredAppointments,
        selectedPatientData,

        setDate, setShowForm, setBonified, setSelectedInstitution, setIsOutOfHours: booking.setIsOutOfHours,
        setReason, setSyncReferenceInfo, setSyncingZombieId,

        setActionModal, setPrescribeModal, setHistoryModal, setPaymentModal, setAuthModalOpen,
        setRetryAction, setShowNextSlotModal, booking, // pass booking object if needed for whatsapp modal but setter is simpler
        setWhatsappModal: booking.setWhatsappModal, // Booking owns whatsapp modal state
        setEditPatientModalOpen, setSelectedPatient,

        updateStatus, updateAppointment, fetchAppointments, savePrescription,
        deleteAppointment, rescheduleAppointment, bookAppointment,
        fetchNextFreeSlots, setSlotHistory,
        addHoliday, deleteHoliday,
        copyToClipboard
    });

    // Handle the effect that needed the handler
    useEffect(() => {
        if (syncAppt) {
            hookHandlers.handleSyncGoogleEvent(syncAppt);
        }
    }, [syncAppt]);

    const handleAdminAuthConfirm = (password) => hookHandlers.handleAdminAuthConfirm(retryAction, password);

    // Grouping handlers for "handlers aparte" request
    const handlers = {
        ...hookHandlers,
        handleAdminAuthConfirm,
        handleWhatsAppUniversal,
        syncDayToGoogle,
        cancelAppointment,
        fetchAppointments,
        handleCancel: (id, reason) => cancelAppointment(id, fetchAppointments, reason),
        exitRescheduleMode,
        rescheduleAppt, // Exposing state as prop in handlers if needed, or keep in state
    };

    return {
        // Wrapper State
        viewDoctorId, setViewDoctorId,
        doctors, institutions, loading,
        selectedDate, setSelectedDate,
        activeTab, setActiveTab,
        showOutOfHours, setShowOutOfHours,
        t, user,

        // Modals
        editPatientModalOpen, setEditPatientModalOpen,
        paymentModal, setPaymentModal,
        actionModal, setActionModal,
        historyModal, setHistoryModal,
        prescribeModal, setPrescribeModal,
        authModalOpen, setAuthModalOpen,
        whatsappModal, setWhatsappModal,
        showNextSlotModal, setShowNextSlotModal,

        // Sub-Hooks Exports
        holidays,
        booking,
        patientSearch,
        nextSlot,

        // Data
        currentDoctor,
        filteredAppointments,
        appointments,
        calendarStats,
        doctorSchedule,

        // Patient Search (Safe Exposure)
        searchPatientId, setSearchPatientId,
        patientAppointments, patientApptLoading,

        // Handlers Group
        handlers,

        // Legacy/Direct State Access (for backward compat if needed, but prefer handlers)
        rescheduleAppt,
        exitRescheduleMode // [FIX] Expose this directly
    };
};


import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
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
    const [viewDoctorId, setViewDoctorId] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [doctors, setDoctors] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('calendar');

    // --- Modals State ---
    const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [retryAction, setRetryAction] = useState(null);

    // --- Sub-Hooks ---
    const { updateStatus, cancelAppointment, deleteAppointment, rescheduleAppointment, savePrescription } = useAppointments();
    const { holidays, addHoliday, deleteHoliday } = useHolidays();

    const patientSearch = usePatientSearch();
    const { searchTerm, setSearchTerm, searchPatientId, setSearchPatientId, appointments, setAppointments, patientAppointments, patientApptLoading, fetchAppointments } = patientSearch;

    const { googleEvents, doctorSchedule, refreshGoogleEvents } = useGoogleEvents(viewDoctorId, selectedDate, user.role);
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

    const fetchAllData = async () => {
        await fetchAppointments();
        try {
            const [dRes, iRes] = await Promise.all([api.get('/users/doctors'), api.get('/institutions')]);
            setDoctors(dRes.data);
            setInstitutions(iRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAllData(); }, [user.role]);

    useEffect(() => {
        localStorage.setItem('last_selected_doctor_id', viewDoctorId);
        if (!selectedDoctor && viewDoctorId) setSelectedDoctor(viewDoctorId);
    }, [viewDoctorId, selectedDoctor]);

    useEffect(() => {
        localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        if (!viewDoctorId) setViewDoctorId(selectedDoctor);
    }, [selectedDoctor, viewDoctorId]);

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
    }, [selectedDoctor, booking.date, doctorSchedule]);

    const rescheduleAppt = location.state?.rescheduleAppt;
    const syncAppt = location.state?.syncAppt;
    const exitRescheduleMode = () => navigate(location.pathname, { replace: true, state: {} });

    // We can't move this effect to handlers easily as it runs on mount/update logic logic
    useEffect(() => {
        if (rescheduleAppt) { setViewDoctorId(rescheduleAppt.doctor_id); return; }
        if (syncAppt) {
            setViewDoctorId(syncAppt.doctor_id);
            setSelectedDate(new Date(syncAppt.appointment_date));
            // We need to call the handler here, but handlers are defined below.
            // This is a circular dependency if we aren't careful.
            // Ideally, we move this logic or allow the handler to be called.
            // For now, let's defer the call or re-implement simple setter here.
            // Actually, handleSyncGoogleEvent IS complex.
            // Let's instantiate handlers first!
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
    }).map(app => (!app.patient_id && app.google_event_id) ? { ...app, source: 'google-incomplete', status: 'external' } : app);

    const uniqueGoogleEvents = googleEvents.filter(ge => {
        const originalId = ge.id.replace('goo_', '');
        return !appointments.some(appt => appt.google_event_id === originalId);
    });

    const filteredAppointments = [...localFiltered, ...uniqueGoogleEvents].filter(app => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (app.patient_name || app.full_name || '').toLowerCase().includes(term) ||
            (app.reason || '').toLowerCase().includes(term) ||
            (app.patient_phone || '').toLowerCase().includes(term);
    });

    // --- Using the Handlers Hook ---
    // We pass EVERYTHING the handlers might need.
    const handlers = useAppointmentsHandlers({
        user, t, showMessage, confirm, navigate,

        selectedDate, setSelectedDate,
        viewDoctorId, selectedDoctor, setSelectedDoctor,
        rescheduleAppt, exitRescheduleMode,
        holidays, doctors, settings,
        appointments, filteredAppointments,
        selectedPatientData,

        setDate, setShowForm, setBonified, setSelectedInstitution,
        setReason, setSyncReferenceInfo, setSyncingZombieId,

        setActionModal, setPrescribeModal, setAuthModalOpen,
        setRetryAction, setShowNextSlotModal, booking, // pass booking object if needed for whatsapp modal but setter is simpler
        setWhatsappModal: booking.setWhatsappModal, // Booking owns whatsapp modal state

        updateStatus, fetchAppointments, savePrescription,
        deleteAppointment, rescheduleAppointment, bookAppointment,
        fetchNextFreeSlots,
        copyToClipboard
    });

    // Handle the effect that needed the handler
    useEffect(() => {
        if (syncAppt) {
            handlers.handleSyncGoogleEvent(syncAppt);
        }
    }, [syncAppt]);

    const handleAdminAuthConfirm = (password) => handlers.handleAdminAuthConfirm(retryAction, password);

    return {
        // Wrapper State
        viewDoctorId, setViewDoctorId,
        doctors, institutions, loading,
        selectedDate, setSelectedDate,
        activeTab, setActiveTab,

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
        holidays, addHoliday, deleteHoliday,
        booking,
        patientSearch,
        nextSlot,

        // Data
        currentDoctor,
        filteredAppointments,
        appointments,
        doctorSchedule,

        // Patient Search (Safe Exposure)
        searchPatientId, setSearchPatientId,
        patientAppointments, patientApptLoading,

        // Spread Handlers
        ...handlers,
        handleAdminAuthConfirm,
        handleWhatsAppUniversal,
        refreshGoogleEvents,
        cancelAppointment, fetchAppointments,

        // Misc
        rescheduleAppt,
        exitRescheduleMode,
        t, user,
    };
};

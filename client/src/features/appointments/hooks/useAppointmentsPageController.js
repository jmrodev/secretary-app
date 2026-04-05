import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../api/axios';
import { usePermissions } from '../../../hooks/usePermissions';
import { useMessage } from '../../../context/MessageContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useModal } from '../../../context/ModalContext';
import { useConfig } from '../../../context/ConfigContext';

import { useAppointments } from './useAppointments';
import { useHolidays } from './useHolidays';
import { useNextFreeSlot } from './useNextFreeSlot';
import { useAppointmentBooking } from './useAppointmentBooking';
import { useWhatsAppUniversal } from './useWhatsAppUniversal';
import { useGoogleEvents } from './useGoogleEvents';
import { usePatientSearch } from './usePatientSearch';
import { useAppointmentsHandlers } from './useAppointmentsHandlers';
import { copyToClipboard } from '../../../utils/clipboardUtils';

/**
 * useAppointmentsPageController (Handler Hook).
 * Orchestrates all state and side effects for the Appointments Page.
 */
export const useAppointmentsPageController = () => {
    const { user, isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff } = usePermissions();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { confirm } = useModal();
    const navigate = useNavigate();
    const location = useLocation();

    const [viewDoctorId, setViewDoctorId] = useState(location.state?.viewDoctorId || localStorage.getItem('last_selected_doctor_id') || '');
    const [doctors, setDoctors] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date());
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'calendar');
    const [showOutOfHours, setShowOutOfHours] = useState(false);
    const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [retryAction, setRetryAction] = useState(null);
    const [calendarStats, setCalendarStats] = useState({});

    const { updateStatus, updateAppointment, cancelAppointment, deleteAppointment, rescheduleAppointment, savePrescription } = useAppointments();
    const { holidays, addHoliday, deleteHoliday } = useHolidays();
    const patientSearch = usePatientSearch();
    const { searchPatientId, setSearchPatientId, appointments, patientAppointments, patientApptLoading, fetchAppointments } = patientSearch;
    const { doctorSchedule, syncDayToGoogle } = useGoogleEvents(viewDoctorId, selectedDate, user?.role);
    const { handleWhatsAppUniversal } = useWhatsAppUniversal(doctors);
    const booking = useAppointmentBooking(doctors);
    const nextSlot = useNextFreeSlot(viewDoctorId || booking.selectedDoctor);

    const fetchAllData = useCallback(async () => {
        await fetchAppointments();
        try {
            const [dRes, iRes] = await Promise.all([api.get('/users/doctors'), api.get('/institutions')]);
            setDoctors(dRes.data); setInstitutions(iRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [fetchAppointments]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    useEffect(() => {
        const doctorId = viewDoctorId || booking.selectedDoctor;
        if (doctorId) localStorage.setItem('last_selected_doctor_id', doctorId);
        if (viewDoctorId && !booking.selectedDoctor) booking.setSelectedDoctor(viewDoctorId);
        if (booking.selectedDoctor && !viewDoctorId) setViewDoctorId(booking.selectedDoctor);
    }, [viewDoctorId, booking.selectedDoctor]);

    useEffect(() => {
        if (!viewDoctorId) return;
        const fetchStats = async () => {
            try {
                const res = await api.get(`/appointments/stats?year=${selectedDate.getFullYear()}&month=${selectedDate.getMonth() + 1}&doctor_id=${viewDoctorId}`);
                setCalendarStats(res.data);
            } catch (e) { console.error(e); }
        };
        fetchStats();
    }, [viewDoctorId, selectedDate.getMonth(), selectedDate.getFullYear(), appointments?.length]);

    const rescheduleAppt = location.state?.rescheduleAppt;
    const syncAppt = location.state?.syncAppt;
    const exitRescheduleMode = useCallback(() => navigate(location.pathname, { replace: true, state: {} }), [navigate, location.pathname]);

    useEffect(() => {
        if (rescheduleAppt) { setViewDoctorId(rescheduleAppt.doctor_id); return; }
        if (syncAppt) { setViewDoctorId(syncAppt.doctor_id); setSelectedDate(new Date(syncAppt.appointment_date)); }
        if (isDoctor && doctors.length > 0) {
            const profile = doctors.find(d => d.user_id === (user.user_id || user.id));
            if (profile) setViewDoctorId(profile.id);
        }
    }, [user, doctors, rescheduleAppt, syncAppt]);

    const hookHandlers = useAppointmentsHandlers({
        user, t, showMessage, confirm, navigate, selectedDate, setSelectedDate,
        viewDoctorId, setViewDoctorId, selectedDoctor: booking.selectedDoctor, setSelectedDoctor: booking.setSelectedDoctor,
        rescheduleAppt, exitRescheduleMode, holidays, doctors, settings, appointments,
        filteredAppointments: appointments, selectedPatientData: booking.selectedPatientData,
        setDate: booking.setDate, setShowForm: booking.setShowForm, setBonified: booking.setBonified,
        setSelectedInstitution: booking.setSelectedInstitution, setIsOutOfHours: booking.setIsOutOfHours,
        setReason: booking.setReason, setSyncReferenceInfo: booking.setSyncReferenceInfo, setSyncingZombieId: booking.setSyncingZombieId,
        setActionModal, setPrescribeModal, setHistoryModal, setPaymentModal, setAuthModalOpen,
        setRetryAction, setShowNextSlotModal: nextSlot.setShowModal, booking,
        setWhatsappModal: booking.setWhatsappModal, setEditPatientModalOpen, setSelectedPatient: booking.setSelectedPatient,
        updateStatus, updateAppointment, fetchAppointments, savePrescription, deleteAppointment, rescheduleAppointment, bookAppointment: booking.bookAppointment,
        fetchNextFreeSlots: nextSlot.fetchNextFreeSlots, setSlotHistory: nextSlot.setSlotHistory, addHoliday, deleteHoliday, copyToClipboard
    });

    const handlers = {
        ...hookHandlers,
        handleAdminAuthConfirm: (password) => hookHandlers.handleAdminAuthConfirm(retryAction, password),
        handleWhatsAppUniversal, syncDayToGoogle, cancelAppointment, fetchAppointments,
        handleCancel: (id, reason) => cancelAppointment(id, fetchAppointments, reason),
        exitRescheduleMode, rescheduleAppt
    };

    return {
        viewDoctorId, setViewDoctorId, doctors, institutions, loading, selectedDate, setSelectedDate,
        activeTab, setActiveTab, showOutOfHours, setShowOutOfHours, t, user,
        editPatientModalOpen, setEditPatientModalOpen, paymentModal, setPaymentModal,
        actionModal, setActionModal, historyModal, setHistoryModal, prescribeModal, setPrescribeModal,
        authModalOpen, setAuthModalOpen, whatsappModal: booking.whatsappModal, setWhatsappModal: booking.setWhatsappModal,
        showNextSlotModal: nextSlot.showModal, setShowNextSlotModal: nextSlot.setShowModal,
        holidays, booking, patientSearch, nextSlot, currentDoctor: viewDoctorId ? doctors.find(d => d.id === Number(viewDoctorId)) : null,
        filteredAppointments: appointments, appointments, calendarStats, doctorSchedule,
        searchPatientId, setSearchPatientId, patientAppointments, patientApptLoading, handlers, rescheduleAppt, exitRescheduleMode
    };
};

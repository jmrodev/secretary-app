import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';

import { useAppointments } from './useAppointments';
import { useHolidays } from './useHolidays';
import { useNextFreeSlot } from './useNextFreeSlot';
import { useAppointmentBooking } from './useAppointmentBooking';
import { useWhatsAppUniversal } from './useWhatsAppUniversal';
import { useGoogleEvents } from './useGoogleEvents';
import { usePatientSearch } from './usePatientSearch';
import { useAppointmentsHandlers } from './useAppointmentsHandlers';
import { copyToClipboard } from '@/utils/clipboardUtils';

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

    // --- Data Fetching using useFetch ---
    
    // Doctors and Institutions
    const { data: doctors = [], loading: doctorsLoading } = useFetch('/users/doctors', { initialData: [] });
    const { data: institutions = [], loading: institutionsLoading } = useFetch('/institutions', { initialData: [] });

    // Calendar Stats
    const { data: calendarStats = {} } = useFetch('/appointments/stats', {
        params: {
            year: selectedDate.getFullYear(),
            month: selectedDate.getMonth() + 1,
            doctor_id: viewDoctorId
        },
        immediate: !!viewDoctorId,
        initialData: {}
    });

    const { updateStatus, updateAppointment, cancelAppointment, deleteAppointment, rescheduleAppointment, savePrescription } = useAppointments();
    const { holidays, addHoliday, deleteHoliday } = useHolidays();
    const patientSearch = usePatientSearch();
    const { searchPatientId, setSearchPatientId, appointments, patientAppointments, patientApptLoading, fetchAppointments } = patientSearch;
    const { doctorSchedule, syncDayToGoogle } = useGoogleEvents(viewDoctorId, selectedDate, user?.role);
    const { handleWhatsAppUniversal } = useWhatsAppUniversal(doctors);
    const booking = useAppointmentBooking(doctors);
    const nextSlot = useNextFreeSlot(viewDoctorId || booking.selectedDoctor);

    const loading = doctorsLoading || institutionsLoading || patientApptLoading;

    useEffect(() => {
        const doctorId = viewDoctorId || booking.selectedDoctor;
        if (doctorId) localStorage.setItem('last_selected_doctor_id', doctorId);
        if (viewDoctorId && !booking.selectedDoctor) booking.setSelectedDoctor(viewDoctorId);
        if (booking.selectedDoctor && !viewDoctorId) queueMicrotask(() => setViewDoctorId(booking.selectedDoctor));
    }, [viewDoctorId, booking.selectedDoctor, booking.setSelectedDoctor, booking]);

    const rescheduleAppt = location.state?.rescheduleAppt;
    const syncAppt = location.state?.syncAppt;
    const exitRescheduleMode = useCallback(() => navigate(location.pathname, { replace: true, state: {} }), [navigate, location.pathname]);

    useEffect(() => {
        if (rescheduleAppt) { queueMicrotask(() => setViewDoctorId(rescheduleAppt.doctor_id)); return; }
        if (syncAppt) {
            queueMicrotask(() => {
                setViewDoctorId(syncAppt.doctor_id);
                setSelectedDate(new Date(syncAppt.appointment_date));
            });
        }
        
        // Initial doctor selection for doctors
        if (isDoctor && doctors.length > 0 && !viewDoctorId) {
            const profile = doctors.find(d => d.user_id === (user.user_id || user.id));
            if (profile) {
                queueMicrotask(() => setViewDoctorId(profile.id));
                booking.setSelectedDoctor(profile.id);
            }
        }
    }, [user, doctors, rescheduleAppt, syncAppt, isDoctor, booking, viewDoctorId]);

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
        exitRescheduleMode, rescheduleAppt,
        setActiveTab, setShowOutOfHours, setViewDoctorId, setSelectedDate,
        setEditPatientModalOpen, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setAuthModalOpen, setSearchPatientId
    };

    return {
        viewDoctorId, doctors, institutions, loading, selectedDate,
        activeTab, showOutOfHours, t, user,
        editPatientModalOpen, paymentModal,
        actionModal, historyModal, prescribeModal,
        authModalOpen, whatsappModal: booking.whatsappModal, setWhatsappModal: booking.setWhatsappModal,
        showNextSlotModal: nextSlot.showModal, setShowNextSlotModal: nextSlot.setShowModal,
        holidays, booking, patientSearch, nextSlot, currentDoctor: viewDoctorId ? doctors.find(d => d.id === Number(viewDoctorId)) : null,
        filteredAppointments: appointments, appointments, calendarStats, doctorSchedule,
        searchPatientId, patientAppointments, patientApptLoading, handlers, rescheduleAppt, exitRescheduleMode
    };
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';

import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { useHolidays } from '@/features/appointments/hooks/useHolidays';
import { useNextFreeSlot } from '@/features/appointments/hooks/useNextFreeSlot';
import { useAppointmentBooking } from '@/features/appointments/hooks/useAppointmentBooking';
import { useWhatsAppUniversal } from '@/features/appointments/hooks/useWhatsAppUniversal';
import { useGoogleEvents } from '@/features/appointments/hooks/useGoogleEvents';
import { usePatientSearch } from '@/features/appointments/hooks/usePatientSearch';
import { useAppointmentsHandlers } from '@/features/appointments/hooks/useAppointmentsHandlers';
import { copyToClipboard } from '@/utils/clipboardUtils';
import { useDoctors } from '@/context/DoctorContext';

/**
 * useAppointmentsPageController (Handler Hook).
 * Orchestrates all state and side effects for the Appointments Page.
 */
export const useAppointmentsPageController = () => {
    const { user, isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff } = usePermissions();
    const { t, language } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { confirm } = useModal();
    const navigate = useNavigate();
    const location = useLocation();

    const { viewDoctorId, setViewDoctorId, doctors, doctorsLoading } = useDoctors();
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
    
    // Institutions
    const { data: instData, loading: institutionsLoading } = useFetch('/institutions', { 
        initialData: { institutions: [], totalCount: 0 } 
    });
    const institutions = instData?.institutions || [];

    // Insurances (Required for PatientManagerModal)
    const { data: insData } = useFetch('/insurances', { 
        initialData: { insurances: [], totalCount: 0 } 
    });
    const insurances = insData?.insurances || [];

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
        // syncing logic simplified by context
    }, [viewDoctorId, booking]);

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
        
        // Initial logic moved to DoctorContext
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
        viewDoctorId, doctors, institutions, insurances, loading, selectedDate,
        activeTab, showOutOfHours, t, language, user,
        editPatientModalOpen, paymentModal,
        actionModal, historyModal, prescribeModal,
        authModalOpen, whatsappModal: booking.whatsappModal, setWhatsappModal: booking.setWhatsappModal,
        showNextSlotModal: nextSlot.showModal, setShowNextSlotModal: nextSlot.setShowModal,
        holidays, booking, patientSearch, nextSlot, currentDoctor: viewDoctorId ? doctors.find(d => d.id === Number(viewDoctorId)) : null,
        filteredAppointments: appointments, appointments, calendarStats, doctorSchedule,
        searchPatientId, patientAppointments, patientApptLoading, handlers, rescheduleAppt, exitRescheduleMode
    };
};

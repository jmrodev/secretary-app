import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';

import { useAppointments } from './useAppointments';
import { useHolidays } from './useHolidays';
import { useNextFreeSlot } from './useNextFreeSlot';
import { useAppointmentBooking } from './useAppointmentBooking';
import { useWhatsAppUniversal } from './useWhatsAppUniversal';
import { useGoogleSync } from './useGoogleSync';
import { useDoctorSchedules } from './useDoctorSchedules';
import { usePatientAppointmentSearch } from './usePatientAppointmentSearch';
import { useAppointmentsHandlers } from './useAppointmentsHandlers';
import { copyToClipboard } from '@/utils/core/clipboardUtils';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useAgendaState } from './useAgendaState';
import { useAgendaModals } from './useAgendaModals';
import { getNow, parseDate } from '@/utils/core/dateUtils';

/**
 * useAppointmentsPageController (Orchestrator).
 * Orchestrates all state and side effects for the Appointments Page.
 */
export const useAppointmentsPageController = () => {
    // --- 1. Base Hooks ---
    const { user, language, isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff } = usePermissions();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { confirm, prompt } = useModal();
    const navigate = useNavigate();

    // --- 2. Global State Hooks ---
    const { viewDoctorId, setViewDoctorId, doctors, doctorsLoading, doctorsFetched } = useDoctors();
    const agendaState = useAgendaState(setViewDoctorId);
    const agendaModals = useAgendaModals();

    const { 
        selectedDate: rawSelectedDate, setSelectedDate, 
        showOutOfHours, setShowOutOfHours, rescheduleAppt, exitRescheduleMode 
    } = agendaState;

    const selectedDate = useMemo(() => parseDate(rawSelectedDate) || getNow(), [rawSelectedDate]);

    const { 
        editPatientModalOpen, setEditPatientModalOpen, paymentModal, setPaymentModal,
        actionModal, setActionModal, historyModal, setHistoryModal,
        prescribeModal, setPrescribeModal, authModalOpen, setAuthModalOpen,
        retryAction, setRetryAction
    } = agendaModals;

    // --- 3. Data Fetching Hooks ---
    const institutionsHook = useFetch('/institutions', { 
        initialData: { success: true, data: { institutions: [], totalCount: 0 } } 
    });
    
    const insurancesHook = useFetch('/insurances', { 
        initialData: { success: true, data: { insurances: [], totalCount: 0 } } 
    });

    const statsParams = useMemo(() => ({
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        doctor_id: viewDoctorId
    }), [selectedDate, viewDoctorId]);

    const calendarStatsHook = useFetch('/appointments/stats', {
        params: statsParams,
        immediate: !!viewDoctorId,
        initialData: { success: true, data: {} }
    });

    const agendaAppointmentsHook = useFetch('/appointments/month-report', {
        params: statsParams,
        immediate: !!viewDoctorId,
        initialData: { success: true, data: { appointments: [] } }
    });

    const patientSearch = usePatientAppointmentSearch();
    const { 
        searchTerm, setSearchTerm, searchPatientId, setSearchPatientId, 
        appointments: searchResults, patientAppointments, patientApptLoading: searchLoading, fetchAppointments: fetchSearch 
    } = patientSearch;

    // --- 4. Logic & Handler Hooks ---
    const { updateStatus, updateAppointment, cancelAppointment, deleteAppointment, rescheduleAppointment, savePrescription } = useAppointments();
    const { holidays } = useHolidays();
    const { doctorSchedule } = useDoctorSchedules(viewDoctorId);
    const { syncDayToGoogle } = useGoogleSync();
    const { handleWhatsAppUniversal } = useWhatsAppUniversal(doctors);
    const booking = useAppointmentBooking(doctors);
    const nextSlot = useNextFreeSlot(viewDoctorId || booking.selectedDoctor);

    // --- 5. Derived State & Callbacks ---
    const institutions = useMemo(() => institutionsHook.data?.data?.institutions || [], [institutionsHook.data]);
    const insurances = useMemo(() => insurancesHook.data?.data?.insurances || [], [insurancesHook.data]);
    const calendarStats = useMemo(() => calendarStatsHook.data?.data || {}, [calendarStatsHook.data]);
    const agendaAppointments = useMemo(() => agendaAppointmentsHook.data?.data || {}, [agendaAppointmentsHook.data]);
    const agendaLoading = agendaAppointmentsHook.loading;

    const realAgendaList = useMemo(() => {
        const appts = agendaAppointments?.appointments;
        if (!appts) return [];
        if (Array.isArray(appts)) {
            if (appts.length > 0 && appts[0].appointments) {
                return appts.flatMap(day => day.appointments || []);
            }
            return appts;
        }
        return Object.values(appts).flatMap(day => day.appointments || []);
    }, [agendaAppointments?.appointments]);

    const displayedAppointments = useMemo(() => {
        if (searchTerm && searchTerm.trim().length > 0) return searchResults || [];
        return realAgendaList;
    }, [searchTerm, searchResults, realAgendaList]);

    const fetchAppointments = useCallback(async () => {
        await Promise.all([
            agendaAppointmentsHook.refetch(),
            searchTerm ? fetchSearch() : Promise.resolve()
        ]);
    }, [agendaAppointmentsHook, fetchSearch, searchTerm]);

    const hookHandlers = useAppointmentsHandlers({
        user, t, showMessage, confirm, prompt, navigate, selectedDate, setSelectedDate,
        viewDoctorId, setViewDoctorId, selectedDoctor: booking.selectedDoctor, setSelectedDoctor: booking.setSelectedDoctor,
        rescheduleAppt, exitRescheduleMode, holidays, doctors, settings, appointments: displayedAppointments,
        filteredAppointments: displayedAppointments, selectedPatientData: booking.selectedPatientData,
        setDate: booking.setDate, setShowForm: booking.setShowForm, setBonified: booking.setBonified,
        setSelectedInstitution: booking.setSelectedInstitution, setIsOutOfHours: booking.setIsOutOfHours,
        setReason: booking.setReason, setSyncReferenceInfo: booking.setSyncReferenceInfo, setSyncingZombieId: booking.setSyncingZombieId,
        setActionModal, setPrescribeModal, setHistoryModal, setPaymentModal, setAuthModalOpen,
        setRetryAction, setShowNextSlotModal: nextSlot.setShowModal, booking,
        setWhatsappModal: booking.setWhatsappModal, setEditPatientModalOpen, setSelectedPatient: booking.setSelectedPatient,
        updateStatus, updateAppointment, fetchAppointments, savePrescription, deleteAppointment, rescheduleAppointment, bookAppointment: booking.bookAppointment,
        fetchNextFreeSlots: nextSlot.fetchNextFreeSlots, setSlotHistory: nextSlot.setSlotHistory, copyToClipboard
    });

    const handlers = useMemo(() => ({
        ...hookHandlers,
        handleAdminAuthConfirm: (password) => hookHandlers.handleAdminAuthConfirm(retryAction, password),
        handleWhatsAppUniversal, syncDayToGoogle, cancelAppointment, fetchAppointments,
        handleCancel: (id, reason) => cancelAppointment(id, fetchAppointments, reason),
        exitRescheduleMode, rescheduleAppt,
        setShowOutOfHours,
        setViewDoctorId, setSelectedDate,
        setEditPatientModalOpen, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setAuthModalOpen, setSearchPatientId, setSearchTerm
    }), [
        hookHandlers, retryAction, handleWhatsAppUniversal, syncDayToGoogle, cancelAppointment, fetchAppointments,
        exitRescheduleMode, rescheduleAppt, setShowOutOfHours, setViewDoctorId, setSelectedDate,
        setEditPatientModalOpen, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setAuthModalOpen, setSearchPatientId, setSearchTerm
    ]);

    return {
        viewDoctorId, doctors, institutions, insurances, 
        loading: doctorsLoading, agendaLoading, selectedDate,
        showOutOfHours, t, language, user,
        editPatientModalOpen, paymentModal,
        actionModal, historyModal, prescribeModal,
        authModalOpen, whatsappModal: booking.whatsappModal, setWhatsappModal: booking.setWhatsappModal,
        showNextSlotModal: nextSlot.showModal, setShowNextSlotModal: nextSlot.setShowModal,
        holidays, booking, patientSearch, nextSlot, currentDoctor: viewDoctorId ? doctors.find(d => d.id === Number(viewDoctorId)) : null,
        filteredAppointments: displayedAppointments, appointments: displayedAppointments, calendarStats, 
        doctorSchedule, searchTerm, searchPatientId, patientAppointments, searchLoading, handlers, rescheduleAppt, exitRescheduleMode,
        isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff, fetched: doctorsFetched
    };
};

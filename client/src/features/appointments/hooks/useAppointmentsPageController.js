import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';
import { useFetch } from '@/hooks/useFetch';

import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { useHolidays } from '@/features/appointments/hooks/useHolidays';
import { useNextFreeSlot } from '@/features/appointments/hooks/useNextFreeSlot';
import { useAppointmentBooking } from '@/features/appointments/hooks/useAppointmentBooking';
import { useWhatsAppUniversal } from '@/features/appointments/hooks/useWhatsAppUniversal';
import { useGoogleSync } from '@/features/appointments/hooks/useGoogleSync';
import { useDoctorSchedules } from '@/features/appointments/hooks/useDoctorSchedules';
import { usePatientAppointmentSearch } from '@/features/appointments/hooks/usePatientAppointmentSearch';
import { useAppointmentsHandlers } from '@/features/appointments/hooks/useAppointmentsHandlers';
import { copyToClipboard } from '@/utils/clipboardUtils';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useAgendaState } from '@/features/appointments/hooks/useAgendaState';
import { useAgendaModals } from '@/features/appointments/hooks/useAgendaModals';

/**
 * useAppointmentsPageController (Orchestrator).
 * Orchestrates all state and side effects for the Appointments Page.
 */
export const useAppointmentsPageController = () => {
    // --- 1. Base Hooks ---
    const { 
        user, language, isAdmin, isSecretary, isDoctor, 
        isPatient, isStaff, isMedicalStaff 
    } = usePermissions();
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
        selectedDate, setSelectedDate, activeTab, setActiveTab, 
        showOutOfHours, setShowOutOfHours, rescheduleAppt, exitRescheduleMode 
    } = agendaState;

    const { 
        editPatientModalOpen, setEditPatientModalOpen, paymentModal, setPaymentModal,
        actionModal, setActionModal, historyModal, setHistoryModal,
        prescribeModal, setPrescribeModal, authModalOpen, setAuthModalOpen,
        retryAction, setRetryAction
    } = agendaModals;

    // --- 3. Data Fetching Hooks (Must always run in same order) ---
    const institutionsHook = useFetch('/institutions', { 
        initialData: { institutions: [], totalCount: 0 } 
    });
    
    const { data: insData } = useFetch('/insurances', { 
        initialData: { insurances: [], totalCount: 0 } 
    });

    const statsParams = useMemo(() => ({
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        doctor_id: viewDoctorId
    }), [selectedDate, viewDoctorId]);

    const { data: calendarStats = {}, fetched: statsFetched } = useFetch('/appointments/stats', {
        params: statsParams,
        immediate: !!viewDoctorId,
        initialData: {}
    });

    const { data: agendaAppointments = {}, loading: agendaLoading, refetch: fetchAgenda, fetched: agendaFetched } = useFetch('/appointments/month-report', {
        params: statsParams,
        immediate: !!viewDoctorId,
        initialData: { appointments: [] }
    });

    const patientSearch = usePatientAppointmentSearch();
    const { 
        searchTerm, setSearchTerm, searchPatientId, setSearchPatientId, 
        appointments: searchResults, patientAppointments, patientApptLoading, fetchAppointments: fetchSearch 
    } = patientSearch;

    // --- 4. Logic & Handler Hooks ---
    const { updateStatus, updateAppointment, cancelAppointment, deleteAppointment, rescheduleAppointment, savePrescription } = useAppointments();
    const { holidays, addHoliday, deleteHoliday } = useHolidays();
    const { doctorSchedule } = useDoctorSchedules(viewDoctorId);
    const { syncDayToGoogle } = useGoogleSync(doctors);
    const { handleWhatsAppUniversal } = useWhatsAppUniversal(doctors);
    const booking = useAppointmentBooking(doctors);
    const nextSlot = useNextFreeSlot(viewDoctorId || booking.selectedDoctor);

    // --- 5. Derived State & Callbacks ---
    const institutions = useMemo(() => institutionsHook.data?.institutions || [], [institutionsHook.data]);
    const institutionsLoading = institutionsHook.loading;
    const insurances = useMemo(() => insData?.insurances || [], [insData]);
    
    // Memoize the flat agenda list to prevent recalculation
    const realAgendaList = useMemo(() => {
        const appts = agendaAppointments?.appointments;
        if (!appts) return [];
        // Flattening the object { date: { appointments: [] } }
        return Object.values(appts).flatMap(day => day.appointments || []);
    }, [agendaAppointments?.appointments]);

    // Combined loading state
    const loading = doctorsLoading;
    const fetched = doctorsFetched;
    const searchLoading = patientApptLoading;

    // Unified appointments list: search results if searching, otherwise the monthly agenda
    const displayedAppointments = useMemo(() => {
        if (searchTerm && searchTerm.trim().length > 0) {
            return searchResults || [];
        }
        return realAgendaList;
    }, [searchTerm, searchResults, realAgendaList]);

    const fetchAppointments = useCallback(async () => {
        await Promise.all([
            fetchAgenda(),
            searchTerm ? fetchSearch() : Promise.resolve()
        ]);
    }, [fetchAgenda, fetchSearch, searchTerm]);

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
        fetchNextFreeSlots: nextSlot.fetchNextFreeSlots, setSlotHistory: nextSlot.setSlotHistory, addHoliday, deleteHoliday, copyToClipboard
    });

    const handlers = useMemo(() => ({
        ...hookHandlers,
        handleAdminAuthConfirm: (password) => hookHandlers.handleAdminAuthConfirm(retryAction, password),
        handleWhatsAppUniversal, syncDayToGoogle, cancelAppointment, fetchAppointments,
        handleCancel: (id, reason) => cancelAppointment(id, fetchAppointments, reason),
        exitRescheduleMode, rescheduleAppt,
        setActiveTab, setShowOutOfHours, setViewDoctorId, setSelectedDate,
        setEditPatientModalOpen, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setAuthModalOpen, setSearchPatientId, setSearchTerm
    }), [
        hookHandlers, retryAction, handleWhatsAppUniversal, syncDayToGoogle, cancelAppointment, fetchAppointments,
        exitRescheduleMode, rescheduleAppt, setActiveTab, setShowOutOfHours, setViewDoctorId, setSelectedDate,
        setEditPatientModalOpen, setPaymentModal, setActionModal, setHistoryModal,
        setPrescribeModal, setAuthModalOpen, setSearchPatientId, setSearchTerm
    ]);

    return {
        viewDoctorId, doctors, institutions, insurances, 
        loading: loading, 
        agendaLoading: agendaLoading, 
        selectedDate,
        institutionsLoading, 
        activeTab, showOutOfHours, t, language, user,
        editPatientModalOpen, paymentModal,
        actionModal, historyModal, prescribeModal,
        authModalOpen, whatsappModal: booking.whatsappModal, setWhatsappModal: booking.setWhatsappModal,
        showNextSlotModal: nextSlot.showModal, setShowNextSlotModal: nextSlot.setShowModal,
        holidays, booking, patientSearch, nextSlot, currentDoctor: viewDoctorId ? doctors.find(d => d.id === Number(viewDoctorId)) : null,
        filteredAppointments: displayedAppointments, appointments: displayedAppointments, calendarStats, 
        doctorSchedule, // This will populate later, won't block 'loading' or 'agendaLoading'
        searchTerm, searchPatientId, patientAppointments, patientApptLoading, searchLoading, handlers, rescheduleAppt, exitRescheduleMode,
        isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff,
        fetched: fetched 
    };

};

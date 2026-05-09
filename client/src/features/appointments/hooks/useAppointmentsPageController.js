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
    const { user, language } = usePermissions();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings } = useConfig();
    const { confirm, prompt } = useModal();
    const navigate = useNavigate();

    const { viewDoctorId, setViewDoctorId, doctors, doctorsLoading } = useDoctors();
    
    // Extracted Logic Hooks
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
    const patientSearch = usePatientAppointmentSearch();
    const { 
        searchTerm, setSearchTerm, searchPatientId, setSearchPatientId, 
        appointments, patientAppointments, patientApptLoading, fetchAppointments 
    } = patientSearch;
    const { doctorSchedule, syncDayToGoogle } = useGoogleEvents(viewDoctorId, selectedDate, user?.role);
    const { handleWhatsAppUniversal } = useWhatsAppUniversal(doctors);
    const booking = useAppointmentBooking(doctors);
    const nextSlot = useNextFreeSlot(viewDoctorId || booking.selectedDoctor);

    const loading = doctorsLoading || institutionsLoading;
    const searchLoading = patientApptLoading;

    const hookHandlers = useAppointmentsHandlers({
        user, t, showMessage, confirm, prompt, navigate, selectedDate, setSelectedDate,
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
        setPrescribeModal, setAuthModalOpen, setSearchPatientId, setSearchTerm
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
        searchTerm, searchPatientId, patientAppointments, patientApptLoading, searchLoading, handlers, rescheduleAppt, exitRescheduleMode
    };
};

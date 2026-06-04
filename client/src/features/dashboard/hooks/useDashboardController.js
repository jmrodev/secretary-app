import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useConfig } from '@/context/ConfigContext';
import { useAppointments } from '@/features/appointments';
import api from '@/api/axios';

import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { useDashboardReminders } from '@/features/dashboard/hooks/useDashboardReminders';
import { useDashboardModals } from '@/features/dashboard/hooks/useDashboardModals';
import { useDashboardWhatsApp } from '@/features/dashboard/hooks/useDashboardWhatsApp';

/**
 * Controller hook for Dashboard component.
 * Orchesrates stats, reminders, appointments and modal states at the root level.
 */
export const useDashboardController = () => {
    const permissions = usePermissions();
    const { user, isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff } = permissions;
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { settings } = useConfig();

    const { updateStatus, cancelAppointment, deleteAppointment, savePrescription } = useAppointments();
    
    const [viewDoctorId, setViewDoctorId] = useState(localStorage.getItem('last_selected_doctor_id') || '');

    const statsHook = useDashboardStats(isStaff, viewDoctorId);
    const remindersHook = useDashboardReminders({ user, t, settings, showMessage });
    const modalsHook = useDashboardModals();
    const whatsAppHook = useDashboardWhatsApp({ user, settings, showMessage, t });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('requirements');

    // Fetch Data Methods (Force refetch)
    const refreshDashboard = () => {
        statsHook.fetchStats();
        statsHook.fetchRequests();
        if (isStaff) {
            statsHook.fetchNewPatientStats();
        }
    };

    // Periodic Refresh handled by standard useEffect
    useEffect(() => {
        if (!user || isPatient) return;

        const interval = setInterval(() => {
            // We use the refreshDashboard method which is already stable via useCallback (inferred)
            // or just call the internal fetch methods.
            refreshDashboard();
            remindersHook.fetchReminders();
        }, 30000);
        
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isPatient]); // Only re-run if user or role changes

    // Action Handlers
    const handleUpdateStatus = async (id, status) => {
        await updateStatus(id, status, (id, newStatus) => {
            if (modalsHook.actionModal.open && modalsHook.actionModal.appt && modalsHook.actionModal.appt.id === id) {
                modalsHook.setActionModal(prev => ({
                    ...prev,
                    appt: { ...prev.appt, status: newStatus }
                }));
            }
            refreshDashboard();
        });
    };

    const handleSaveNote = async (id, note, date) => {
        try {
            await api.put(`/appointments/${id}`, { reason: note, appointment_date: date });
            showMessage(t('note_saved'), 'success');
            refreshDashboard();
        } catch (e) {
            console.error(e);
            showMessage(t('error_saving_note'), 'error');
        }
    };

    const handleDelete = async (id) => {
        await deleteAppointment(id, modalsHook.actionModal.appt, {
            onUpdate: () => {
                refreshDashboard();
                modalsHook.setActionModal({ open: false, appt: null });
            }
        });
    };

    const handleCancel = async (id) => {
        await cancelAppointment(id, () => {
            refreshDashboard();
            if (modalsHook.actionModal.open && modalsHook.actionModal.appt?.id === id) {
                modalsHook.setActionModal(prev => ({ ...prev, appt: { ...prev.appt, status: 'cancelled' } }));
            }
        });
    };

    const handleUpdateType = async (id, type) => {
        try {
            await api.put(`/appointments/${id}`, { type });
            showMessage(t('status_updated'), 'success');
            refreshDashboard();
            if (modalsHook.actionModal.open && modalsHook.actionModal.appt?.id === id) {
                modalsHook.setActionModal(prev => ({ ...prev, appt: { ...prev.appt, type } }));
            }
        } catch (err) {
            console.error(err);
            showMessage(t('failed_update'), 'error');
        }
    };

    const handlePrescriptionSubmit = async ({ medications, instructions, items, bonified }) => {
        setIsSubmitting(true);
        try {
            await savePrescription({
                apptId: modalsHook.prescribeModal.apptId,
                patientId: modalsHook.prescribeModal.patientId,
                medications,
                instructions,
                items,
                bonified
            }, () => {
                modalsHook.setPrescribeModal({ ...modalsHook.prescribeModal, open: false });
                refreshDashboard();
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlers = {
        refreshDashboard,
        handleUpdateStatus,
        handleDelete,
        handleCancel,
        handleWhatsApp: whatsAppHook.handleWhatsApp,
        handlePrescriptionSubmit,
        handleOpenPayment: modalsHook.handleOpenPayment,
        handleOpenHistory: modalsHook.handleOpenHistory,
        handleOpenPrescribe: modalsHook.handleOpenPrescribe,
        handleOpenReschedule: modalsHook.handleOpenReschedule,
        handleOpenSync: modalsHook.handleOpenSync,
        handleHardEdit: modalsHook.handleHardEdit,
        handleUpdateType,
        handleSaveNote,
        handleCompleteReminder: remindersHook.handleCompleteReminder,
        handleWhatsAppReminder: remindersHook.handleWhatsAppReminder,
        handleMarkNotified: remindersHook.handleMarkNotified,
        setActiveTab,
        setViewDoctorId: (id) => {
            setViewDoctorId(id);
            localStorage.setItem('last_selected_doctor_id', id);
        },
        setActionModal: modalsHook.setActionModal,
        setHistoryModal: modalsHook.setHistoryModal,
        setPrescribeModal: modalsHook.setPrescribeModal,
        setPaymentModal: modalsHook.setPaymentModal,
        setNewRequestModal: modalsHook.setNewRequestModal,
        handleOpenNewRequest: modalsHook.handleOpenNewRequest,
        navigate: modalsHook.navigate
    };

    const loading = statsHook.loadingDoctors;


    const error =
        statsHook.errorStats ||
        statsHook.errorDoctors ||
        statsHook.errorRequests ||
        remindersHook.errorReminders ||
        (isStaff ? statsHook.errorNewPatientStats : null);

    return {
        // State exposed for orchestration
        user, t, settings,
        loading,
        error,
        stats: statsHook.stats,
        newPatientStats: statsHook.newPatientStats,
        reminders: remindersHook.reminders,
        pendingReqCount: statsHook.pendingReqCount,
        activeTab,
        actionModal: modalsHook.actionModal,
        historyModal: modalsHook.historyModal,
        prescribeModal: modalsHook.prescribeModal,
        paymentModal: modalsHook.paymentModal,
        newRequestModal: modalsHook.newRequestModal,
        fetched: statsHook.fetchedDoctors,

        isSubmitting,

        viewDoctorId,
        setViewDoctorId,
        doctors: statsHook.doctors,
        handlers,
        isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff
    };
};

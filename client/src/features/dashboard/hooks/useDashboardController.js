import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/context/LanguageContext';
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

    const statsHook = useDashboardStats(isStaff);
    const remindersHook = useDashboardReminders({ user, t, settings, showMessage });
    const modalsHook = useDashboardModals();
    const whatsAppHook = useDashboardWhatsApp({ user, settings, showMessage });

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
            remindersHook.fetchReminders();
            statsHook.fetchRequests();
            statsHook.fetchStats();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [user, isPatient, remindersHook, statsHook]);

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
            showMessage(t('note_saved') || 'Nota actualizada', 'success');
            refreshDashboard();
        } catch (e) {
            console.error(e);
            showMessage('Error al guardar nota', 'error');
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

    const handlePrescriptionSubmit = async ({ medications, instructions, bonified }) => {
        setIsSubmitting(true);
        try {
            await savePrescription({
                apptId: modalsHook.prescribeModal.apptId,
                medications,
                instructions,
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
        setActionModal: modalsHook.setActionModal,
        setHistoryModal: modalsHook.setHistoryModal,
        setPrescribeModal: modalsHook.setPrescribeModal,
        setPaymentModal: modalsHook.setPaymentModal,
        navigate: modalsHook.navigate
    };

    return {
        // State exposed for orchestration
        user, t, settings,
        stats: statsHook.stats,
        newPatientStats: statsHook.newPatientStats,
        reminders: remindersHook.reminders,
        pendingReqCount: statsHook.pendingReqCount,
        activeTab,
        actionModal: modalsHook.actionModal,
        historyModal: modalsHook.historyModal,
        prescribeModal: modalsHook.prescribeModal,
        paymentModal: modalsHook.paymentModal,
        isSubmitting,
        doctors: statsHook.doctors,
        handlers,
        isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff
    };
};

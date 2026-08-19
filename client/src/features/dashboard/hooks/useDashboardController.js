import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useConfig } from '@/context/ConfigContext';
import { useAppointments } from '@/features/appointments';
import { api } from '@/api/axios';

import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { useDashboardReminders } from '@/features/dashboard/hooks/useDashboardReminders';
import { useDashboardModals } from '@/features/dashboard/hooks/useDashboardModals';
import { useDashboardWhatsApp } from '@/features/dashboard/hooks/useDashboardWhatsApp';
import { useDoctors } from '@/context/DoctorContextDefinition';

/**
 * ECC-Pattern: useDashboardController Hook (Orchestrator)
 */
export const useDashboardController = () => {
    const permissions = usePermissions();
    const { user, isStaff, isPatient, isAdmin, isSecretary, isDoctor, isMedicalStaff } = permissions;
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { settings } = useConfig();

    const { updateStatus, cancelAppointment, deleteAppointment, savePrescription } = useAppointments();
    
    // ECC: Use global doctor context instead of local state
    const { viewDoctorId, setViewDoctorId, doctors, doctorsLoading, doctorsFetched } = useDoctors();

    const statsHook = useDashboardStats(isStaff, viewDoctorId);
    const remindersHook = useDashboardReminders({ user, t, settings, showMessage });
    const modalsHook = useDashboardModals();
    const whatsAppHook = useDashboardWhatsApp({ user, settings, showMessage, t });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('requirements');

    const refreshDashboard = () => {
        statsHook.refetch();
    };

    // React 19 useEffectEvent: stable polling callback that always reads the
    // latest refreshDashboard / remindersHook without effect dependency churn.
    const onPollDashboard = React.useEffectEvent(() => {
        refreshDashboard();
        remindersHook.fetchReminders();
    });

    useEffect(() => {
        if (!user || isPatient) return;
        const interval = setInterval(onPollDashboard, 30000);
        return () => clearInterval(interval);
    }, [user, isPatient]);

    const handleUpdateStatus = async (id, status) => {
        await updateStatus(id, status, (id, newStatus) => {
            if (modalsHook.actionModal.open && String(modalsHook.actionModal.appt?.id) === String(id)) {
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
        setViewDoctorId,
        setActionModal: modalsHook.setActionModal,
        setHistoryModal: modalsHook.setHistoryModal,
        setPrescribeModal: modalsHook.setPrescribeModal,
        setPaymentModal: modalsHook.setPaymentModal,
        setNewRequestModal: modalsHook.setNewRequestModal,
        handleOpenNewRequest: modalsHook.handleOpenNewRequest,
        navigate: modalsHook.navigate
    };

    return {
        user, t, settings,
        loading: statsHook.loading || doctorsLoading,
        error: statsHook.error || remindersHook.errorReminders,
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
        fetched: statsHook.fetched && doctorsFetched,
        isSubmitting,
        viewDoctorId,
        setViewDoctorId,
        doctors,
        handlers,
        isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff
    };
};

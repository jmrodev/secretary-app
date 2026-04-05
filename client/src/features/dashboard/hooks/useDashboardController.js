import { useState, useEffect } from 'react';
import { usePermissions } from '../../../hooks/usePermissions';
import { useMessage } from '../../../context/MessageContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useConfig } from '../../../context/ConfigContext';
import { useAppointments } from '../../appointments';
import api from '../../../api/axios';
import { copyToClipboard } from '../../../utils/clipboardUtils';
import { useNavigate } from 'react-router-dom';

/**
 * Controller hook for Dashboard component.
 * Orchesrates stats, reminders, appointments and modal states at the root level.
 */
export const useDashboardController = () => {
    const { user, isStaff, isAdmin, isSecretary, isDoctor, isPatient, isMedicalStaff } = usePermissions();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { settings } = useConfig();
    const navigate = useNavigate();

    const { updateStatus, cancelAppointment, deleteAppointment, savePrescription } = useAppointments();

    const [doctors, setDoctors] = useState([]);
    const [stats, setStats] = useState(null);
    const [newPatientStats, setNewPatientStats] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [loadingReminders, setLoadingReminders] = useState(true);
    const [pendingReqCount, setPendingReqCount] = useState(0);
    const [activeTab, setActiveTab] = useState('requirements');

    // Modals state management
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {}, apptId: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Data Methods
    const refreshDashboard = () => {
        fetchStats();
        fetchRequests();
        fetchDoctors();
        if (isStaff) {
            fetchNewPatientStats();
        }
    };

    const fetchReminders = async () => {
        try {
            const res = await api.get('/users/reminders');
            setReminders(res.data);
        } catch (err) {
            console.error("Failed to fetch reminders", err);
        } finally {
            setLoadingReminders(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/users/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) {
            console.error("Failed to fetch doctors", err);
        }
    };

    const fetchNewPatientStats = async () => {
        try {
            const res = await api.get('/users/patients/stats/new');
            setNewPatientStats({
                current_new: 0,
                currentDay: 0,
                currentWeek: 0,
                currentMonth: 0,
                currentYear: 0,
                lastYear: 0,
                ...res.data
            });
        } catch (err) {
            console.error("Failed to fetch new patient stats", err);
            setNewPatientStats({ current_new: 0, currentDay: 0, currentWeek: 0, currentMonth: 0, currentYear: 0, lastYear: 0 });
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get('/medical/requests');
            const pending = res.data.filter(r => r.status === 'pending').length;
            setPendingReqCount(pending);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    // Orchestration Effects
    useEffect(() => {
        fetchStats();
        if (user && !isPatient) {
            fetchReminders();
            fetchRequests();
        }
        if (user && (user.role === 'admin' || user.role === 'secretary')) {
            fetchNewPatientStats();
        }
        const interval = setInterval(() => {
            if (user && !isPatient) {
                fetchReminders();
                fetchRequests();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [user?.role]);

    // Action Handlers
    const handleUpdateStatus = async (id, status) => {
        await updateStatus(id, status, (id, newStatus) => {
            if (actionModal.open && actionModal.appt && actionModal.appt.id === id) {
                setActionModal(prev => ({
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
        await deleteAppointment(id, actionModal.appt, {
            onUpdate: () => {
                refreshDashboard();
                setActionModal({ open: false, appt: null });
            }
        });
    };

    const handleCancel = async (id) => {
        await cancelAppointment(id, () => {
            refreshDashboard();
            if (actionModal.open && actionModal.appt?.id === id) {
                setActionModal(prev => ({ ...prev, appt: { ...prev.appt, status: 'cancelled' } }));
            }
        });
    };

    const handleOpenPayment = (appt) => {
        setPaymentModal({
            open: true,
            initialData: {
                type: 'income_patient',
                amount: appt.cost || 0,
                patientId: appt.patient_id,
                patientName: appt.patient_name,
                patientDni: appt.patient_dni,
                patientUserId: appt.patient_user_id,
                doctorId: appt.doctor_id,
                description: `Payment for appointment on ${new Date(appt.appointment_date).toLocaleDateString()}`,
                apptId: appt.id
            },
            apptId: appt.id
        });
        setActionModal({ ...actionModal, open: false });
    };

    const handleOpenHistory = (appt) => {
        setHistoryModal({
            open: true,
            patientId: appt.patient_id,
            patientName: appt.patient_name
        });
        setActionModal({ ...actionModal, open: false });
    };

    const handleOpenPrescribe = (appt) => {
        setPrescribeModal({
            open: true,
            apptId: appt.id,
            patientName: appt.patient_name,
            medications: '',
            instructions: ''
        });
        setActionModal({ ...actionModal, open: false });
    };

    const handleOpenReschedule = (appt) => {
        navigate('/appointments', { state: { rescheduleAppt: appt } });
    };

    const handleOpenSync = (appt) => {
        navigate('/appointments', { state: { syncAppt: appt } });
    };

    const handleHardEdit = (appt) => {
        navigate('/appointments', { state: { editAppt: appt } });
    };

    const handleUpdateType = async (id, type) => {
        try {
            await api.put(`/appointments/${id}`, { type });
            showMessage(t('status_updated'), 'success');
            refreshDashboard();
            if (actionModal.open && actionModal.appt?.id === id) {
                setActionModal(prev => ({ ...prev, appt: { ...prev.appt, type } }));
            }
        } catch (err) {
            showMessage(t('failed_update'), 'error');
        }
    };

    const handleWhatsApp = (appt, type) => {
        let phone = appt.patient_phone;
        if (!phone) {
            const phoneMatch = appt.reason?.match(/\d{9,13}/);
            if (phoneMatch) {
                phone = phoneMatch[0];
            } else {
                showMessage("No phone number available. Please adjust/sync the appointment first.", "error");
                return;
            }
        }

        const dateStr = new Date(appt.appointment_date).toLocaleDateString();
        const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        let message = '';

        if (type === 'reminder') {
            let messageTemplate = settings.appointment_reminder_template;
            if (!messageTemplate || !messageTemplate.trim()) {
                messageTemplate = `Hola {patient_name}, te escribimos para confirmar tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name}. Por favor confirma asistencia. Gracias!`;
            }
            message = messageTemplate
                .replace(/{patient_name}/g, appt.patient_name || appt.reason)
                .replace(/{date}/g, dateStr)
                .replace(/{time}/g, timeStr)
                .replace(/{doctor_name}/g, appt.doctor_name)
                .replace(/{secretary_name}/g, user.name || 'Secretaria');
        } else {
            message = `Hola {patient_name}, tu turno ha sido confirmado para el {date} a las {time}. Gracias por confiar en nosotros!`
                .replace(/{patient_name}/g, appt.patient_name)
                .replace(/{date}/g, dateStr)
                .replace(/{time}/g, timeStr);
        }

        copyToClipboard(message).then(() => {
            showMessage("Texto copiado! Abriendo WhatsApp...", "success");
            phone = phone.replace(/\D/g, '');
            if (!phone.startsWith('54') && phone.length >= 10) {
                phone = '549' + phone;
            }
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            } else {
                const appUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
                const webUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
                window.location.href = appUrl;
                setTimeout(() => window.open(webUrl, '_blank'), 2500);
            }
        }).catch(err => {
            console.error(err);
            showMessage("Error al copiar texto", "error");
        });
    };

    const handlePrescriptionSubmit = async ({ medications, instructions, bonified }) => {
        setIsSubmitting(true);
        try {
            await savePrescription({
                apptId: prescribeModal.apptId,
                medications,
                instructions,
                bonified
            }, () => {
                setPrescribeModal({ ...prescribeModal, open: false });
                refreshDashboard();
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteReminder = async (reminder, type) => {
        try {
            await api.post('/users/reminders/complete', {
                patientId: reminder.id,
                type: type,
                medIds: reminder.expiring_med_ids
            });
            showMessage(t('reminder_completed') || 'Recordatorio completado', 'success');
            fetchReminders();
        } catch (err) {
            console.error(err);
            showMessage(t('error_completing_reminder') || 'Error al completar recordatorio', 'error');
        }
    };

    const handleMarkNotified = async (reminder, type, notified = true) => {
        try {
            await api.post('/users/reminders/complete', {
                patientId: reminder.id,
                type: type,
                medIds: reminder.expiring_med_ids,
                notified: notified
            });
            showMessage(t('status_updated') || 'Estado actualizado', 'success');
            fetchReminders();
        } catch (err) {
            console.error(err);
            showMessage(t('error_updating_status') || 'Error al actualizar estado', 'error');
        }
    };

    const handleWhatsAppReminder = (reminder, typeOverride) => {
        const phone = reminder.phone;
        if (!phone) return showMessage(t('no_phone_available'), 'error');

        let type = typeOverride || 'visit';
        if (!typeOverride) {
            if (reminder.expiring_meds) type = 'medication';
            else if (reminder.next_suggested_prescription_date) type = 'prescription';
            else if (reminder.license_expiry_date) type = 'license';
        }

        let message = '';
        if (type === 'medication') {
            const template = settings.medication_refill_reminder_template ||
                'Hola {patient_name}, te recordamos que según nuestros registros tu medicación ({medication_name}) está próxima a terminarse. ¿Necesitas que te preparemos la receta? Atte: {secretary_name}';
            message = template
                .replace('{patient_name}', reminder.full_name)
                .replace('{medication_name}', reminder.expiring_meds)
                .replace('{secretary_name}', user.full_name || '');
        } else if (type === 'visit') {
            message = `Hola ${reminder.full_name}, te escribimos de Cima Salud para recordarte que ya es tiempo de tu próximo control sugerido. ¿Te gustaría agendar un turno?`;
        } else if (type === 'prescription') {
            message = `Hola ${reminder.full_name}, te escribimos de Cima Salud para recordarte que es tiempo de renovar tu receta.`;
        } else if (type === 'license') {
            message = `Hola ${reminder.full_name}, te recordamos que tu licencia médica está por vencer.`;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');

        // Auto-mark as notified
        handleMarkNotified(reminder, type, true);
    };

    return {
        // State exposed for orchestration
        user, t, settings,
        stats, newPatientStats, reminders, pendingReqCount, activeTab, setActiveTab,
        actionModal, setActionModal,
        historyModal, setHistoryModal,
        prescribeModal, setPrescribeModal,
        paymentModal, setPaymentModal,
        isSubmitting,
        doctors,

        // Exposed handlers for direct component interaction
        refreshDashboard,
        handleUpdateStatus,
        handleDelete,
        handleCancel,
        handleWhatsApp,
        handlePrescriptionSubmit,
        handleOpenPayment,
        handleOpenHistory,
        handleOpenPrescribe,
        handleOpenReschedule,
        handleOpenSync,
        handleHardEdit,
        handleUpdateType,
        handleSaveNote,
        handleCompleteReminder,
        handleWhatsAppReminder,
        handleWhatsAppReminder,
        handleMarkNotified,
        navigate,
        isAdmin, isSecretary, isDoctor, isPatient, isStaff, isMedicalStaff
    };
};

import { useState, useEffect, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext'; // Import hook
import Modal from '../components/Modal';
import TransactionModal from '../components/TransactionModal';
import RequirementsList from '../components/RequirementsList';
import Sidebar from '../components/Sidebar';
import { useModal } from '../context/ModalContext';
import PatientHistoryModal from '../components/PatientHistoryModal';
import { useConfig } from '../context/ConfigContext';
import { copyToClipboard } from '../utils/clipboardUtils';
import MedicationAutocomplete from '../components/MedicationAutocomplete';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { showMessage } = useMessage();
    const { alert, confirm, prompt, doubleConfirm } = useModal();
    const { t, toggleLanguage, language } = useLanguage(); // Use hook
    const { settings } = useConfig();
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stats, setStats] = useState(null);
    const [newPatientStats, setNewPatientStats] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [loadingReminders, setLoadingReminders] = useState(true);

    // Unified Action Modal (Sync with Appointments.jsx)
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });

    // Prescription Modal
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });

    // Payment Modal
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {}, apptId: null });

    const [activeTab, setActiveTab] = useState('requirements');
    const [pendingReqCount, setPendingReqCount] = useState(0);


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

    const fetchNewPatientStats = async () => {
        try {
            const res = await api.get('/users/patients/stats/new');
            // Ensure we have defaults if some keys are missing
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



    const handleUpdateStatus = async (id, status) => {
        let reason = null;
        if (status === 'cancelled') {
            reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
            if (!reason) return; // User cancelled the prompt
        }

        try {
            await api.put(`/appointments/${id}/status`, { status, reason });
            showMessage(t('status_updated'), 'success');
            fetchSchedule();
            // Update actionModal appt state if open
            if (actionModal.open && actionModal.appt && actionModal.appt.id === id) {
                setActionModal(prev => ({
                    ...prev,
                    appt: { ...prev.appt, status }
                }));
            }
        } catch (err) {
            console.error(err);
            showMessage(t('failed_update'), 'error');
        }
    };

    const handleDelete = async (id) => {
        // [NEW] Prevent deletion of attended appointments (unless unrestricted CRUD enabled)
        const apptToDelete = upcomingAppointments.find(a => a.id === id);
        if (apptToDelete && (apptToDelete.status === 'completed' || apptToDelete.status === 'attended') && settings.enable_secretary_unrestricted_crud !== 'true') {
            await alert(t('cannot_delete_attended') || "Cannot delete an appointment that has been attended.");
            return;
        }

        if (!await doubleConfirm(
            t('confirm_delete_appointment') || "¿Está seguro? Esto eliminará el registro permanentemente.",
            t('confirm_permanent_delete') || "Esta acción es irreversible. ¿Confirmar eliminación definitiva?"
        )) return;
        try {
            await api.delete(`/appointments/${id}`);
            showMessage(t('appointment_deleted'), 'success');
            fetchSchedule();
        } catch (err) {
            console.error(err);
            showMessage(t('failed_delete'), 'error');
        }
    };

    const handleReschedule = async (id, newDate) => {
        try {
            const isoDate = new Date(newDate).toISOString();
            await api.put(`/appointments/${id}`, { appointment_date: isoDate });
            showMessage(t('rescheduled_success'), 'success');
            fetchSchedule();
        } catch (err) {
            console.error(err);
            showMessage(t('failed_reschedule'), 'error');
        }
    };

    const handleCancel = async (id) => {
        const reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
        if (!reason) return;
        if (!await confirm(t('confirm_cancel'))) return;

        try {
            await api.put(`/appointments/${id}/status`, { status: 'cancelled', reason });
            showMessage(t('appointment_cancelled'), 'success');
            fetchSchedule();
        } catch (err) {
            console.error(err);
            showMessage(t('failed_cancel'), 'error');
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

    useEffect(() => {
        fetchStats();
        if (user.role !== 'patient') {
            fetchReminders();
            fetchRequests();
        }
        if (user.role === 'admin' || user.role === 'secretary') {
            fetchNewPatientStats();
        }
        const interval = setInterval(() => {
            if (user.role !== 'patient') {
                fetchReminders();
                fetchRequests();
            }
        }, 30000); // 30 seconds for reminders
        return () => clearInterval(interval);
    }, [user.role]);

    const handleWhatsAppConfirm = (appt) => {
        let phone = appt.patient_phone;

        if (!phone) {
            // Heuristic for zombie appointments: try to find a phone in the reason field
            const phoneMatch = appt.reason?.match(/\d{9,13}/); // Look for 9-13 digit numbers
            if (phoneMatch) {
                phone = phoneMatch[0];
            } else {
                showMessage("No phone number available. Please adjust/sync the appointment first.", "error");
                return;
            }
        }

        const dateStr = new Date(appt.appointment_date).toLocaleDateString();
        const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        let messageTemplate = settings.appointment_reminder_template;
        if (!messageTemplate || !messageTemplate.trim()) {
            messageTemplate = `Hola {patient_name}, te escribimos para confirmar tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name}. Por favor confirma asistencia. Gracias!`;
        }

        const message = messageTemplate
            .replace(/{patient_name}/g, appt.patient_name || appt.reason)
            .replace(/{date}/g, dateStr)
            .replace(/{time}/g, timeStr)
            .replace(/{doctor_name}/g, appt.doctor_name)
            .replace(/{secretary_name}/g, user.name || 'Secretaria');

        // Copy to clipboard
        copyToClipboard(message).then(() => {
            showMessage("Texto copiado! Abriendo WhatsApp...", "success");

            // Format phone: remove non-digits
            phone = phone.replace(/\D/g, '');
            // Assume Argentina (549) if not starting with country code (naive check)
            if (!phone.startsWith('54') && phone.length >= 10) {
                phone = '549' + phone;
            }

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            let url;
            if (isMobile) {
                url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            } else {
                // Desktop: Go directly to WhatsApp Web to avoid "Download App" prompts
                url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
            }

            window.open(url, '_blank');
        }).catch(err => {
            console.error("Failed to copy text: ", err);
            showMessage("Error al copiar el texto.", "error");
        });
    };

    if (!user) return <div>{t('loading')}</div>;

    const handleSavePrescription = async () => {
        if (!prescribeModal.medications.trim() || isSubmitting) {
            if (!prescribeModal.medications.trim()) showMessage(t('please_enter_meds'), 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/medical/prescriptions', {
                appointment_id: prescribeModal.apptId,
                medications: prescribeModal.medications,
                instructions: prescribeModal.instructions
            });
            showMessage(t('prescription_created'), 'success');
            setPrescribeModal({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data || t('failed_prescription');
            showMessage(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="app-layout">
            {/* Action Modal for Appointment */}
            {actionModal.open && actionModal.appt && (
                <Modal
                    isOpen={actionModal.open}
                    onClose={() => setActionModal({ ...actionModal, open: false })}
                    title={`Appointment: ${actionModal.appt.patient_name || actionModal.appt.reason || 'Sincronización requerida'}`}
                >
                    <div className="flex-col-gap-4">
                        <div className="flex-between">
                            <p><strong>{t('patient_label') || 'Paciente'}:</strong> {actionModal.appt.patient_name || actionModal.appt.reason || 'Sincronización requerida'}</p>
                            <p><strong>{t('date_label')}:</strong> {new Date(actionModal.appt.appointment_date).toLocaleString()}</p>
                            <div className="flex gap-2">
                                <span className={`status-chip status-${actionModal.appt.status}`}>
                                    {t(actionModal.appt.status) || actionModal.appt.status}
                                </span>
                                <span className={`status-badge-wrapper badge-${actionModal.appt.payment_status === 'paid' ? 'green' : 'red'}`}>
                                    {t(actionModal.appt.payment_status) || actionModal.appt.payment_status}
                                </span>
                            </div>
                        </div>
                        <p><strong>{t('reason')}:</strong> {actionModal.appt.reason || t('no_description')}</p>

                        {/* Doctor Workflow Panel */}
                        {user.role === 'doctor' && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 mb-2">
                                <h4 className="text-xs font-bold text-main-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    👨‍⚕️ {t('medical_panel') || 'Panel Médico'}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <button
                                        className="btn btn-primary btn-sm flex items-center justify-center gap-2"
                                        onClick={() => {
                                            setHistoryModal({
                                                open: true,
                                                patientId: actionModal.appt.patient_id,
                                                patientName: actionModal.appt.patient_name
                                            });
                                            setActionModal({ ...actionModal, open: false });
                                        }}
                                    >
                                        🩺 {t('view_history') || 'Ver H. Clínica'}
                                    </button>
                                    <button
                                        className="btn btn-accent btn-sm flex items-center justify-center gap-2"
                                        onClick={() => {
                                            setPrescribeModal({
                                                open: true,
                                                apptId: actionModal.appt.id,
                                                patientName: actionModal.appt.patient_name,
                                                medications: '',
                                                instructions: ''
                                            });
                                            setActionModal(prev => ({ ...prev, open: false }));
                                        }}
                                    >
                                        💊 {t('prescribe') || 'Recetar'}
                                    </button>
                                    <button
                                        className="btn btn-status-complete btn-sm flex items-center justify-center gap-2 col-span-2"
                                        onClick={async () => {
                                            if (await confirm(t('confirm_attended') || 'Mark as Attended/Completed?')) {
                                                handleUpdateStatus(actionModal.appt.id, 'completed');
                                                setActionModal(prev => ({ ...prev, open: false }));
                                            }
                                        }}
                                    >
                                        ✅ {t('attended') || 'Atendido'}
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="input-field text-sm py-1"
                                        placeholder={t('evolution_note_placeholder') || "Nota de evolución / Razón..."}
                                        defaultValue={actionModal.appt.reason || ''}
                                        id="quick-evolution-note"
                                    />
                                    <button
                                        className="btn btn-secondary btn-sm px-3"
                                        title={t('save_note') || "Guardar Nota"}
                                        onClick={async () => {
                                            const note = document.getElementById('quick-evolution-note').value;
                                            try {
                                                await api.put(`/appointments/${actionModal.appt.id}`, {
                                                    reason: note,
                                                    appointment_date: actionModal.appt.appointment_date
                                                });
                                                showMessage(t('note_saved') || 'Nota actualizada', 'success');
                                                // Refresh local state to reflect change without full reload being jarring
                                                setActionModal(prev => ({
                                                    ...prev,
                                                    appt: { ...prev.appt, reason: note }
                                                }));
                                                fetchSchedule();
                                            } catch (e) { console.error(e); }
                                        }}
                                    >
                                        💾
                                    </button>
                                </div>
                            </div>
                        )}

                        <hr className="border-divider" />

                        {/* Sync Needed / Zombie Action */}
                        {actionModal.appt.source === 'google-incomplete' && (
                            <button
                                className="btn btn-accent w-full py-4 mb-4"
                                onClick={() => {
                                    navigate('/appointments', { state: { syncAppt: actionModal.appt } });
                                }}
                                style={{ background: 'linear-gradient(135deg, var(--amber-500) 0%, var(--orange-600) 100%)', border: 'none', color: 'white' }}
                            >
                                ✨ Ingresar Ajuste (Vincular Paciente)
                            </button>
                        )}

                        {/* Administrative Actions */}
                        {(user.role === 'secretary' || user.role === 'admin') && (
                            <div className="grid-2-cols">
                                {(actionModal.appt.payment_status === 'pending' || actionModal.appt.payment_status === 'debt') && actionModal.appt.source !== 'google-incomplete' && (
                                    <button className="btn btn-primary" onClick={() => {
                                        setPaymentModal({
                                            open: true,
                                            initialData: {
                                                type: 'income_patient',
                                                amount: actionModal.appt.cost || 0,
                                                patientId: actionModal.appt.patient_id,
                                                patientName: actionModal.appt.patient_name,
                                                patientDni: actionModal.appt.patient_dni,
                                                patientUserId: actionModal.appt.patient_user_id,
                                                doctorId: actionModal.appt.doctor_id,
                                                description: `Payment for appointment on ${new Date(actionModal.appt.appointment_date).toLocaleDateString()}`,
                                                apptId: actionModal.appt.id
                                            },
                                            apptId: actionModal.appt.id
                                        });
                                        setActionModal({ ...actionModal, open: false });
                                    }}>
                                        💳 {t('pay')}
                                    </button>
                                )}
                                {(actionModal.appt.status !== 'completed' || settings.enable_secretary_unrestricted_crud === 'true') && actionModal.appt.source !== 'google-incomplete' && (
                                    <button className="btn btn-secondary" onClick={() => {
                                        navigate('/appointments', { state: { rescheduleAppt: actionModal.appt } });
                                    }}>
                                        📅 {t('reschedule')}
                                    </button>
                                )}
                                {actionModal.appt.source !== 'google-incomplete' && (
                                    <button className="btn btn-outline-danger" onClick={() => {
                                        handleCancel(actionModal.appt.id);
                                        setActionModal({ ...actionModal, open: false });
                                    }}>
                                        ❌ {t('cancel')}
                                    </button>
                                )}
                                {(user.role === 'admin' || user.role === 'secretary') && (
                                    <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => {
                                        handleDelete(actionModal.appt.id);
                                        setActionModal({ ...actionModal, open: false });
                                    }}>
                                        🗑 {t('delete_error')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            <Modal
                isOpen={prescribeModal.open}
                onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                title={`${t('prescription_for') || 'Receta para'} ${prescribeModal.patientName}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setPrescribeModal({ ...prescribeModal, open: false })}>{t('cancel')}</button>
                        <button className="btn btn-primary" onClick={handleSavePrescription} disabled={!prescribeModal.medications.trim() || isSubmitting}>
                            {isSubmitting ? t('sending') : t('create')}
                        </button>
                    </>
                }
            >
                <div className="flex-col-gap-4">
                    <div className="input-group">
                        <label className="input-label">{t('medications')}</label>
                        <MedicationAutocomplete
                            value=""
                            onChange={() => { }}
                            placeholder={t('search_medication') || "Buscar medicamento..."}
                            onSelectMedication={(med) => {
                                const current = prescribeModal.medications.trim();
                                const newValue = current ? `${current}\n${med.full_label}` : med.full_label;
                                setPrescribeModal({ ...prescribeModal, medications: newValue });
                            }}
                        />
                        <textarea
                            className="input-field mt-2"
                            rows="4"
                            value={prescribeModal.medications}
                            onChange={e => setPrescribeModal({ ...prescribeModal, medications: e.target.value })}
                            placeholder={t('meds_placeholder') || "ej. Ibuprofeno 600mg"}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('instructions')}</label>
                        <textarea className="input-field" rows="3" value={prescribeModal.instructions} onChange={e => setPrescribeModal({ ...prescribeModal, instructions: e.target.value })} placeholder={t('instructions_placeholder') || "ej. Tomar cada 8 horas con comida."} />
                    </div>
                </div>
            </Modal>

            <TransactionModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                initialData={paymentModal.initialData}
                onSuccess={async (data) => {
                    if (paymentModal.apptId) {
                        try {
                            await api.patch(`/appointments/${paymentModal.apptId}/payment`, { status: data.status });
                            showMessage("Payment recorded and Appointment updated!", 'success');
                            fetchSchedule();
                        } catch (e) { console.error(e); }
                    } else {
                        showMessage("Payment recorded!", 'success');
                    }
                }}
            />

            <Sidebar />

            <main className="main-content">
                <div className="w-full">
                    <header className="header-actions">
                        {/* Redundant New Appointment button removed as requested */}
                    </header>

                    <div className="dashboard-grid-layout !items-start">
                        {/* SIDE COLUMN (STATISTICS) - LEFT SIDE */}
                        <aside className="dashboard-side-col">
                            {/* General Statistics Section */}
                            {/* Standardized Minimalist Stats Grid */}
                            {stats && (
                                <div className="flex flex-col gap-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">
                                        {t('general_stats') || 'Estadísticas Generales'}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                                <span className="text-sm">📅</span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{t('turnos_hoy') || 'Hoy'}</span>
                                            </div>
                                            <div className="text-2xl font-black text-main-900 group-hover:text-indigo-600 transition-colors">
                                                {stats.appointments_today}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                                <span className="text-sm">📊</span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{t('turnos_semana') || 'Semana'}</span>
                                            </div>
                                            <div className="text-2xl font-black text-main-900 group-hover:text-emerald-600 transition-colors">
                                                {stats.appointments_week}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                                <span className="text-sm">📈</span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{t('turnos_mes') || 'Mes'}</span>
                                            </div>
                                            <div className="text-2xl font-black text-main-900 group-hover:text-indigo-600 transition-colors">
                                                {stats.appointments_month}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                                <span className="text-sm">👥</span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{t('pacientes_label') || 'Pacientes'}</span>
                                            </div>
                                            <div className="text-2xl font-black text-main-900 group-hover:text-slate-600 transition-colors">
                                                {stats.total_patients}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* New Patient Growth Section */}
                            {newPatientStats && (
                                <div className="flex flex-col gap-3 mt-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">
                                        ✨ {t('new_patients_stat') || 'Crecimiento de Pacientes'}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-indigo-600 p-3 rounded-2xl border border-indigo-500 shadow-sm text-white group">
                                            <div className="flex items-center gap-2 mb-1 opacity-80">
                                                <span className="text-sm">✨</span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{t('this_day') || 'Hoy'}</span>
                                            </div>
                                            <div className="text-2xl font-black italic">
                                                {newPatientStats.currentDay}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                                <span className="text-sm">📅</span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{t('this_week') || 'Esta Sem.'}</span>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">
                                                {newPatientStats.currentWeek}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-white hover:shadow-md group">
                                            <div className="flex items-center gap-2 mb-1 text-slate-500">
                                                <span className="text-sm">📊</span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{t('this_month') || 'Este Mes'}</span>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">
                                                {newPatientStats.currentMonth}
                                            </div>
                                        </div>
                                        <div className="bg-indigo-900 p-3 rounded-2xl border border-indigo-800 shadow-sm text-white group">
                                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                                <span className="text-sm">📈</span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{t('this_year') || 'Este Año'}</span>
                                            </div>
                                            <div className="text-2xl font-black italic">
                                                {newPatientStats.currentYear}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {user.role !== 'admin' && reminders.length > 0 && (
                                <div className="card p-4 border-l-4 border-amber-400 bg-amber-50/20 mt-4 shadow-sm">
                                    <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span>🔔</span> {t('reminders')}
                                    </h4>
                                    <div className="flex flex-col gap-2">
                                        {reminders.slice(0, 3).map(r => (
                                            <div key={r.id} className="text-sm p-2 bg-white/80 rounded-lg border border-amber-100 cursor-pointer hover:bg-white hover:shadow-md transition-all" onClick={() => navigate('/patients', { state: { selectedPatientId: r.id } })}>
                                                <div className="font-bold text-main-800 truncate text-[11px]">{r.full_name}</div>
                                                <div className="text-[10px] text-amber-700 mt-1">
                                                    {r.medical_history_evolution && <div className="truncate italic opacity-75">"{r.medical_history_evolution}"</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>

                        {/* MAIN COLUMN - RIGHT SIDE */}
                        <div className="dashboard-main-col lg:col-span-1">
                            {/* Standardized Tabs */}
                            {(user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                                <div className="tabs-container mt-1">
                                    <button
                                        className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('requirements')}
                                    >
                                        📋 {t('ongoing_requirements')}
                                        {pendingReqCount > 0 && (
                                            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold shadow-sm" title={`${pendingReqCount} pendientes`}>
                                                {pendingReqCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}






                            {activeTab === 'requirements' && (user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                                <section className="transition-all">
                                    <div className="flex items-center justify-end mb-4">
                                        <a href="/requests" className="text-xs font-bold text-blue-600 hover:underline px-3 py-1 bg-blue-50 rounded-full">{t('view_all')} →</a>
                                    </div>
                                    <div className="card p-0 overflow-hidden border-slate-200 shadow-sm">
                                        <RequirementsList user={user} />
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <PatientHistoryModal
                isOpen={historyModal.open}
                onClose={() => setHistoryModal({ ...historyModal, open: false })}
                patientId={historyModal.patientId}
                patientName={historyModal.patientName}
            />
        </div>
    );
};

export default Dashboard;

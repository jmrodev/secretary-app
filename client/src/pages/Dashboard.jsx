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

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { showMessage } = useMessage();
    const { alert, confirm, prompt, doubleConfirm } = useModal();
    const { t, toggleLanguage, language } = useLanguage(); // Use hook
    const { settings } = useConfig();
    const navigate = useNavigate();

    const [todayAppointments, setTodayAppointments] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(true);
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

    const [activeTab, setActiveTab] = useState('schedule');
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

    const fetchSchedule = async () => {
        try {
            const res = await api.get('/appointments');
            const now = new Date();
            const todayStr = now.toLocaleDateString(); // Local date string

            const todaysCalls = res.data.filter(a => {
                const apptDate = new Date(a.appointment_date);
                return apptDate.toLocaleDateString() === todayStr;
            }).sort((a, b) => {
                // Statuses that should be at the top
                const topStatus = ['pending', 'confirmed', 'arrived'];
                const aTop = topStatus.includes(a.status);
                const bTop = topStatus.includes(b.status);

                if (aTop && !bTop) return -1;
                if (!aTop && bTop) return 1;

                // For same group (both top or both bottom), sort by time
                return new Date(a.appointment_date) - new Date(b.appointment_date);
            });
            setTodayAppointments(todaysCalls);

            // Filter Upcoming (Future Dates)
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const upcomingCalls = res.data.filter(a => {
                const apptDate = new Date(a.appointment_date);
                return apptDate >= tomorrow && ['pending', 'confirmed', 'rescheduled'].includes(a.status);
            }).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

            setUpcomingAppointments(upcomingCalls);
        } catch (err) {
            console.error("Failed to fetch schedule", err);
        } finally {
            setLoadingSchedule(false);
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
        const apptToDelete = todayAppointments.find(a => a.id === id);
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
        fetchSchedule();
        fetchStats();
        if (user.role !== 'patient') {
            fetchReminders();
            fetchRequests();
        }
        if (user.role === 'admin' || user.role === 'secretary') {
            fetchNewPatientStats();
        }
        const interval = setInterval(() => {
            fetchSchedule();
            if (user.role !== 'patient') {
                fetchReminders();
                fetchRequests();
            }
        }, 30000); // 30 seconds for reminders
        return () => clearInterval(interval);
    }, [user.role]);

    const handleWhatsAppConfirm = (appt) => {
        if (!appt.patient_phone) {
            showMessage("No phone number available for this patient.", "error");
            return;
        }

        const dateStr = new Date(appt.appointment_date).toLocaleDateString();
        const timeStr = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        let messageTemplate = settings.appointment_reminder_template;
        if (!messageTemplate || !messageTemplate.trim()) {
            messageTemplate = `Hola {patient_name}, te escribimos para confirmar tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name}. Por favor confirma asistencia. Gracias!`;
        }

        const message = messageTemplate
            .replace(/{patient_name}/g, appt.patient_name)
            .replace(/{date}/g, dateStr)
            .replace(/{time}/g, timeStr)
            .replace(/{doctor_name}/g, appt.doctor_name)
            .replace(/{secretary_name}/g, user.name || 'Secretaria');

        // Copy to clipboard
        copyToClipboard(message).then(() => {
            showMessage("Texto copiado! Abriendo WhatsApp...", "success");

            // Format phone: remove non-digits
            let phone = appt.patient_phone.replace(/\D/g, '');
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
                    title={`Appointment: ${actionModal.appt.patient_name}`}
                >
                    <div className="flex-col-gap-4">
                        <div className="flex-between">
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

                        {/* Administrative Actions */}
                        {(user.role === 'secretary' || user.role === 'admin') && (
                            <div className="grid-2-cols">
                                {(actionModal.appt.payment_status === 'pending' || actionModal.appt.payment_status === 'debt') && (
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
                                {(actionModal.appt.status !== 'completed' || settings.enable_secretary_unrestricted_crud === 'true') && (
                                    <button className="btn btn-secondary" onClick={() => {
                                        navigate('/appointments', { state: { rescheduleAppt: actionModal.appt } });
                                    }}>
                                        📅 {t('reschedule')}
                                    </button>
                                )}
                                <button className="btn btn-outline-danger" onClick={() => {
                                    handleCancel(actionModal.appt.id);
                                    setActionModal({ ...actionModal, open: false });
                                }}>
                                    ❌ {t('cancel')}
                                </button>
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
                        <textarea className="input-field" rows="4" value={prescribeModal.medications} onChange={e => setPrescribeModal({ ...prescribeModal, medications: e.target.value })} placeholder={t('meds_placeholder') || "ej. Ibuprofeno 600mg"} autoFocus />
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
                        <div className="flex gap-4 items-center">
                            {user.role !== 'admin' && (
                                <a href="/appointments" className="btn btn-primary no-underline font-bold">
                                    + {t('new_appointment')}
                                </a>
                            )}
                        </div>
                    </header>

                    <div className="dashboard-grid-layout !items-start">
                        {/* SIDE COLUMN (STATISTICS) - LEFT SIDE */}
                        <aside className="dashboard-side-col">
                            {/* General Statistics Section */}
                            {stats && (
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 px-1">{t('general_stats') || 'Estadísticas Generales'}</h4>
                                    <div className="stats-card-mini bg-blue-50 text-blue-700 border border-blue-100 py-2 shadow-sm">
                                        <h4 className="text-[10px]">📅 {t('turnos_hoy') || 'Hoy'}</h4>
                                        <p className="text-lg">{stats.appointments_today}</p>
                                    </div>
                                    <div className="stats-card-mini bg-emerald-50 text-emerald-700 border border-emerald-100 py-2 shadow-sm">
                                        <h4 className="text-[10px]">📊 {t('turnos_semana') || 'Semana'}</h4>
                                        <p className="text-lg">{stats.appointments_week}</p>
                                    </div>
                                    <div className="stats-card-mini bg-indigo-50 text-indigo-700 border border-indigo-100 py-2 shadow-sm">
                                        <h4 className="text-[10px]">📈 {t('turnos_mes') || 'Mes'}</h4>
                                        <p className="text-lg">{stats.appointments_month}</p>
                                    </div>
                                    <div className="stats-card-mini bg-slate-100 text-main-600 border border-slate-200 py-2 shadow-sm">
                                        <h4 className="text-[10px]">👥 {t('pacientes_label') || 'Pacientes'}</h4>
                                        <p className="text-lg">{stats.total_patients}</p>
                                    </div>
                                </div>
                            )}

                            {/* New Patient Growth Section - Now integrated as mini aside */}
                            {newPatientStats && (
                                <div className="flex flex-col gap-2 mt-4">
                                    <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 px-1">✨ {t('new_patients_stat') || 'Crecimiento de Pacientes'}</h4>
                                    <div className="stats-card-mini bg-emerald-500 text-white border border-emerald-600 py-2 shadow-sm scale-[1.02]">
                                        <h4 className="text-[10px] opacity-90">✨ {t('this_day') || 'Hoy'}</h4>
                                        <p className="text-lg">{newPatientStats.currentDay}</p>
                                    </div>
                                    <div className="stats-card-mini bg-white text-indigo-700 border border-indigo-50 py-2 shadow-sm">
                                        <h4 className="text-[10px]">📅 {t('this_week') || 'Esta Semana'}</h4>
                                        <p className="text-lg">{newPatientStats.currentWeek}</p>
                                    </div>
                                    <div className="stats-card-mini bg-white text-indigo-700 border border-indigo-50 py-2 shadow-sm">
                                        <h4 className="text-[10px]">📊 {t('this_month') || 'Este Mes'}</h4>
                                        <p className="text-lg">{newPatientStats.currentMonth}</p>
                                    </div>
                                    <div className="stats-card-mini bg-indigo-900 text-white border border-indigo-800 py-2 shadow-sm">
                                        <h4 className="text-[10px] opacity-80">📈 {t('this_year') || 'Este Año'}</h4>
                                        <p className="text-lg">{newPatientStats.currentYear}</p>
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
                            <div className="dash-tabs mt-1">
                                <button
                                    className={`dash-tab ${activeTab === 'schedule' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('schedule')}
                                >
                                    📅 {t('today_schedule')}
                                </button>
                                <button
                                    className={`dash-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('upcoming')}
                                >
                                    📆 {t('upcoming_appointments') || 'Próximos'}
                                </button>
                                {(user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                                    <button
                                        className={`dash-tab ${activeTab === 'requirements' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('requirements')}
                                    >
                                        📋 {t('ongoing_requirements')}
                                        {pendingReqCount > 0 && (
                                            <span className="dot-badge pulse-red ml-2" title={`${pendingReqCount} pending`}>
                                                {pendingReqCount}
                                            </span>
                                        )}
                                    </button>
                                )}
                            </div>

                            {activeTab === 'schedule' && user.role !== 'admin' && (
                                <section className="card p-0 overflow-hidden border-slate-200 shadow-sm transition-all">
                                    {loadingSchedule ? <div className="p-8 text-center text-muted">{t('loading')}</div> : (
                                        todayAppointments.length === 0 ?
                                            <div className="text-center p-12 bg-white">
                                                <p className="text-muted m-0">{t('no_appointments_today')}</p>
                                            </div> :
                                            <div className="overflow-x-auto">
                                                <table className="dashboard-table">
                                                    <thead>
                                                        <tr>
                                                            <th>{t('time_label') || 'Hora'}</th>
                                                            <th>{t('patient_label') || 'Paciente'}</th>
                                                            <th>{t('doctor_label') || 'Doctor'}</th>
                                                            <th>{t('status_label') || 'Estado'}</th>
                                                            <th className="text-right">{t('actions') || 'Acciones'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {todayAppointments.map(a => (
                                                            <tr key={a.id} className="group" onClick={() => setActionModal({ open: true, appt: a })}>
                                                                <td className="font-bold text-main-900 w-24">
                                                                    {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                                </td>
                                                                <td>
                                                                    <div className="font-bold text-main-800">{a.patient_name}</div>
                                                                    {a.reason && <div className="text-[11px] text-muted italic truncate max-w-[200px]">{a.reason}</div>}
                                                                </td>
                                                                <td className="text-main-500 text-sm">
                                                                    {a.doctor_name}
                                                                </td>
                                                                <td>
                                                                    <span className={`status-chip-mini status-${a.status}`}>
                                                                        {t(a.status) || a.status}
                                                                    </span>
                                                                </td>
                                                                <td className="text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <div className="flex gap-1">
                                                                            {a.payment_status === 'paid' && <span title="Paid" className="text-emerald-500 font-bold">$✓</span>}
                                                                            {a.payment_status === 'debt' && <span title="Debt" className="text-rose-500 font-bold">$!</span>}
                                                                        </div>
                                                                        <button onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActionModal({ open: true, appt: a });
                                                                        }} className="btn btn-sm-compact btn-secondary px-3">
                                                                            {t('manage') || 'Gestionar'}
                                                                        </button>
                                                                        {user.role === 'doctor' && (
                                                                            <button onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPrescribeModal({ open: true, apptId: a.id, patientName: a.patient_name, medications: '', instructions: '' });
                                                                            }} className="btn btn-sm-compact btn-primary px-3">Rx</button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                    )}
                                </section>
                            )}


                            {activeTab === 'upcoming' && user.role !== 'admin' && (
                                <section className="card p-0 overflow-hidden border-slate-200 shadow-sm transition-all">
                                    {loadingSchedule ? <div className="p-8 text-center text-muted">{t('loading')}</div> : (
                                        upcomingAppointments.length === 0 ?
                                            <div className="text-center p-12 bg-white">
                                                <p className="text-muted m-0">{t('no_upcoming_appointments') || 'No hay próximos turnos.'}</p>
                                            </div> :
                                            <div className="overflow-x-auto">
                                                <table className="dashboard-table">
                                                    <thead>
                                                        <tr>
                                                            <th>{t('date_label') || 'Fecha'}</th>
                                                            <th>{t('patient_label') || 'Paciente'}</th>
                                                            <th>{t('doctor_label') || 'Doctor'}</th>
                                                            <th>{t('status_label') || 'Estado'}</th>
                                                            <th className="text-right">{t('actions') || 'Acciones'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {upcomingAppointments.map((a, index) => {
                                                            const dateObj = new Date(a.appointment_date);
                                                            const dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                                                            const headerDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

                                                            const prevDateObj = index > 0 ? new Date(upcomingAppointments[index - 1].appointment_date) : null;
                                                            const prevDateStr = prevDateObj ? prevDateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : null;
                                                            const showHeader = index === 0 || dateStr !== prevDateStr;

                                                            return (
                                                                <Fragment key={a.id}>
                                                                    {showHeader && (
                                                                        <tr className="bg-slate-50 border-b border-indigo-100">
                                                                            <td colSpan="5" className="font-bold text-indigo-700 text-xs uppercase tracking-wider py-2 pl-4">
                                                                                {headerDate}
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                    <tr className="group" onClick={() => setActionModal({ open: true, appt: a })}>
                                                                        <td className="font-bold text-main-900 min-w-[120px]">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-main-500">{new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <div className="font-bold text-main-800">{a.patient_name}</div>
                                                                            {a.reason && <div className="text-[11px] text-muted italic truncate max-w-[200px]">{a.reason}</div>}
                                                                        </td>
                                                                        <td className="text-main-500 text-sm">
                                                                            {a.doctor_name}
                                                                        </td>
                                                                        <td>
                                                                            <span className={`status-chip-mini status-${a.status}`}>
                                                                                {t(a.status) || a.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleWhatsAppConfirm(a);
                                                                                }}
                                                                                    className="btn btn-sm-compact bg-green-100 text-green-700 hover:bg-green-200 px-3"
                                                                                    title="Confirmar por WhatsApp"
                                                                                >
                                                                                    📱 Confirmar
                                                                                </button>
                                                                                <button onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActionModal({ open: true, appt: a });
                                                                                }} className="btn btn-sm-compact btn-secondary px-3">
                                                                                    {t('manage') || 'Gestionar'}
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                </Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                    )}
                                </section>
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

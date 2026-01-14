import { useState, useEffect } from 'react';
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

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { showMessage } = useMessage();
    const { alert, confirm, prompt } = useModal();
    const { t, toggleLanguage, language } = useLanguage(); // Use hook
    const { settings } = useConfig();
    const navigate = useNavigate();

    const [todayAppointments, setTodayAppointments] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState(null);
    const [newPatientStats, setNewPatientStats] = useState(null);
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [loadingReminders, setLoadingReminders] = useState(true);

    // Unified Action Modal (Sync with Appointments.jsx)
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });

    // Prescription Modal
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });

    // Payment Modal
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {}, apptId: null });


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
            setNewPatientStats(res.data);
        } catch (err) {
            console.error("Failed to fetch new patient stats", err);
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
            });
            setTodayAppointments(todaysCalls);
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
        // [NEW] Prevent deletion of attended appointments
        const apptToDelete = todayAppointments.find(a => a.id === id);
        if (apptToDelete && (apptToDelete.status === 'completed' || apptToDelete.status === 'attended')) {
            await alert(t('cannot_delete_attended') || "Cannot delete an appointment that has been attended.");
            return;
        }

        if (!await confirm(t('delete_error') || "Are you sure? This will remove the record mostly (Secretary Error).")) return;
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

    useEffect(() => {
        fetchSchedule();
        fetchReminders();
        fetchStats();
        fetchNewPatientStats();
        const interval = setInterval(() => {
            fetchSchedule();
            fetchReminders();
        }, 30000); // 30 seconds for reminders
        return () => clearInterval(interval);
    }, []);

    if (!user) return <div>{t('loading')}</div>;

    const handleSavePrescription = async () => {
        if (!prescribeModal.medications.trim()) {
            showMessage(t('please_enter_meds'), 'warning');
            return;
        }

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
        }
    };

    return (
        <div className="app-layout">
            {/* Action Modal for Appointment (Synced with Appointments.jsx) */}
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
                        <p><strong>{t('reason')}:</strong> {actionModal.appt.reason || t('no_description') || 'No description'}</p>

                        {/* Doctor Workflow Panel */}
                        {user.role === 'doctor' && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 mb-2">
                                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
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

                        {/* ADMINISTRATIVE ACTIONS (Secretary/Admin Only) */}
                        {(user.role === 'secretary' || user.role === 'admin') && (
                            <>
                                <div className="grid-2-cols">
                                    {/* Pay Button */}
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

                                    {/* Reschedule Button - Hide if 'completed' */}
                                    {actionModal.appt.status !== 'completed' && (
                                        <button className="btn btn-secondary" onClick={() => {
                                            navigate('/appointments', { state: { rescheduleAppt: actionModal.appt } });
                                        }}>
                                            📅 {t('reschedule')}
                                        </button>
                                    )}

                                    {/* Action Buttons for Status */}
                                    {actionModal.appt.status === 'pending' && (
                                        <button className="btn btn-status-confirm" onClick={() => {
                                            handleUpdateStatus(actionModal.appt.id, 'confirmed');
                                            setActionModal({ ...actionModal, open: false });
                                        }}>
                                            ✅ {t('confirm')}
                                        </button>
                                    )}

                                    {/* Action Buttons - Hide if 'completed' (Doctor Attended) */}
                                    {actionModal.appt.status !== 'completed' && (
                                        <>
                                            {(user.role === 'secretary' || user.role === 'admin') && actionModal.appt.status !== 'arrived' && (
                                                <button className="btn btn-primary" onClick={() => {
                                                    handleUpdateStatus(actionModal.appt.id, 'arrived');
                                                    setActionModal({ ...actionModal, open: false });
                                                }}>
                                                    🏥 {t('patient_arrived') || 'Asistió (En Sala)'}
                                                </button>
                                            )}

                                            {(actionModal.appt.status === 'confirmed' || actionModal.appt.status === 'pending' || actionModal.appt.status === 'rescheduled' || actionModal.appt.status === 'arrived') && (
                                                <button className="btn btn-status-complete" onClick={() => {
                                                    handleUpdateStatus(actionModal.appt.id, 'completed');
                                                    setActionModal({ ...actionModal, open: false });
                                                }}>
                                                    🏆 {t('attended') || 'Atendido'}
                                                </button>
                                            )}

                                            <button className="btn btn-status-suspend" onClick={() => {
                                                handleUpdateStatus(actionModal.appt.id, 'suspended');
                                                setActionModal({ ...actionModal, open: false });
                                            }}>
                                                ⏸ {t('suspend')}
                                            </button>

                                            <button className="btn btn-status-absent" onClick={() => {
                                                handleUpdateStatus(actionModal.appt.id, 'absent');
                                                setActionModal({ ...actionModal, open: false });
                                            }}>
                                                🚫 {t('absent')}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <hr className="border-divider" />

                                {/* Cancel/Delete - Hide if 'completed' */}
                                {actionModal.appt.status !== 'completed' && (
                                    <div className="grid-2-cols">
                                        {/* Cancel (Standard) */}
                                        <button className="btn btn-outline-danger" onClick={() => {
                                            handleCancel(actionModal.appt.id);
                                            setActionModal({ ...actionModal, open: false });
                                        }}>
                                            ❌ {t('cancel')}
                                        </button>

                                        {/* Delete (Error) - Admin/Secretary Only if NOT attended */}
                                        {(user.role === 'admin' || user.role === 'secretary') &&
                                            (actionModal.appt.status !== 'completed' && actionModal.appt.status !== 'attended') && (
                                                <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => {
                                                    handleDelete(actionModal.appt.id);
                                                    setActionModal({ ...actionModal, open: false });
                                                }}>
                                                    🗑 {t('delete_error')}
                                                </button>
                                            )}
                                    </div>
                                )}
                            </>
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
                        <button className="btn btn-primary" onClick={handleSavePrescription} disabled={!prescribeModal.medications.trim()}>{t('create')}</button>
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

                            setTodayAppointments(prev => prev.map(a =>
                                a.id === paymentModal.apptId ? { ...a, payment_status: data.status } : a
                            ));
                        } catch (e) {
                            console.error(e);
                            showMessage("Payment recorded but failed to update appointment status", 'warning');
                        }
                    } else {
                        showMessage("Payment recorded!", 'success');
                    }
                }}
            />

            <Sidebar />

            <main className="main-content dashboard-wide">
                <header className="header-actions">
                    <h1 className="title">{t('dashboard')}</h1>
                    <div className="flex gap-4 items-center">
                        {user.role !== 'admin' && (
                            <a href="/appointments" className="btn btn-primary no-underline">{t('new_appointment')}</a>
                        )}
                    </div>
                </header>



                {/* New Patient Statistics Card */}
                {newPatientStats && (
                    <div className="card mb-6 bg-gradient-to-r from-purple-50 to-white border border-purple-100">
                        <h3 className="text-purple-800 flex items-center gap-2">✨ Nuevos Pacientes</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                <p className="text-xs text-purple-600 uppercase font-bold mb-1">Esta Semana</p>
                                <p className="text-3xl font-bold text-purple-900">{newPatientStats.currentWeek}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                <p className="text-xs text-purple-600 uppercase font-bold mb-1">Este Mes</p>
                                <p className="text-3xl font-bold text-purple-900">{newPatientStats.currentMonth}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                <p className="text-xs text-purple-600 uppercase font-bold mb-1">Este Año</p>
                                <p className="text-3xl font-bold text-purple-900">{newPatientStats.currentYear}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Año Anterior</p>
                                <p className="text-3xl font-bold text-slate-500">{newPatientStats.lastYear}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-6 text-left">
                    {/* Statistics Section */}
                    {stats && (
                        <div className="grid grid-3-cols gap-4">
                            <div className="card bg-blue-50">
                                <h4 className="text-sm font-bold text-blue-700">📅 Turnos Hoy</h4>
                                <p className="text-3xl font-bold text-blue-900">{stats.appointments_today}</p>
                            </div>
                            <div className="card bg-green-50">
                                <h4 className="text-sm font-bold text-green-700">📊 Turnos Semana</h4>
                                <p className="text-3xl font-bold text-green-900">{stats.appointments_week}</p>
                            </div>
                            <div className="card bg-purple-50">
                                <h4 className="text-sm font-bold text-purple-700">📈 Turnos Mes</h4>
                                <p className="text-3xl font-bold text-purple-900">{stats.appointments_month}</p>
                            </div>
                            <div className="card bg-orange-50">
                                <h4 className="text-sm font-bold text-orange-700">🏥 Total Turnos</h4>
                                <p className="text-3xl font-bold text-orange-900">{stats.total_appointments}</p>
                            </div>
                            <div className="card bg-pink-50">
                                <h4 className="text-sm font-bold text-pink-700">👥 Pacientes</h4>
                                <p className="text-3xl font-bold text-pink-900">{stats.total_patients}</p>
                            </div>
                            <div className="card bg-indigo-50">
                                <h4 className="text-sm font-bold text-indigo-700">📞 Contactos</h4>
                                <p className="text-3xl font-bold text-indigo-900">{stats.total_contacts}</p>
                            </div>
                        </div>
                    )}


                    {user.role !== 'admin' && (
                        <div className="card mb-8 shadow-sm border-l-4 border-blue-500 bg-blue-50/30">
                            <h3>{t('today_schedule')}</h3>
                            {loadingSchedule ? <p>{t('loading')}</p> : (
                                todayAppointments.length === 0 ?
                                    <p className="text-muted">{t('no_appointments_today')}</p> :
                                    <ul className="appointment-list">
                                        {todayAppointments.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)).map(a => {
                                            let itemClass = "appointment-item";
                                            if (a.status === 'completed') itemClass += " status-completed";
                                            else if (a.status === 'cancelled') itemClass += " status-cancelled";
                                            else if (a.status === 'pending') itemClass += " status-pending";

                                            return (
                                                <li key={a.id} className={`${itemClass} clickable`} onClick={() => setActionModal({ open: true, appt: a })}>
                                                    <div>
                                                        <div className="text-sm-bold">
                                                            {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            <span className="text-xs-muted ml-2">
                                                                ({t(a.status)})
                                                            </span>
                                                        </div>
                                                        <div className="font-size-1rem">{a.patient_name}</div>
                                                        <div className="text-sm-normal w-doctor">w/ {a.doctor_name}</div>
                                                        {a.reason && (
                                                            <div className="text-italic-indigo mt-1">
                                                                💬 {a.reason}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {a.payment_status === 'paid' && <span title="Paid" className="text-green-500">$✓</span>}
                                                        {a.payment_status === 'debt' && <span title="Debt" className="text-red-500">$!</span>}
                                                        {user.role === 'doctor' && (
                                                            <button onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPrescribeModal({ open: true, apptId: a.id, patientName: a.patient_name, medications: '', instructions: '' });
                                                            }} title="Write Prescription" className="icon-btn btn-icon-primary">Rx</button>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                            )}
                        </div>
                    )}

                    {user.role !== 'admin' && reminders.length > 0 && (
                        <div className="card mb-8 border-l-4 border-yellow-400 bg-yellow-50/20 shadow-sm">
                            <h3 className="flex items-center gap-2">🔔 {t('reminders')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 text-left">
                                {reminders.map(r => (
                                    <div key={r.id} className="p-3 bg-yellow-50 rounded border border-yellow-100 flex flex-col gap-1 cursor-pointer hover:bg-yellow-100 transition-colors" onClick={() => navigate('/patients', { state: { selectedPatientId: r.id } })}>
                                        <div className="flex-between">
                                            <span className="font-bold text-slate-800">{r.full_name}</span>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded">DUE</span>
                                        </div>
                                        <div className="text-xs text-slate-600">
                                            {r.next_suggested_visit_date && new Date(r.next_suggested_visit_date + 'T23:59:59') <= new Date() && (
                                                <div className="flex items-center gap-1">📅 {t('next_suggested_visit')}: {new Date(r.next_suggested_visit_date + 'T00:00:00').toLocaleDateString()}</div>
                                            )}
                                            {r.next_suggested_prescription_date && new Date(r.next_suggested_prescription_date + 'T23:59:59') <= new Date() && (
                                                <div className="flex items-center gap-1">💊 {t('next_suggested_prescription')}: {new Date(r.next_suggested_prescription_date + 'T00:00:00').toLocaleDateString()}</div>
                                            )}
                                            {r.license_expiry_date && new Date(r.license_expiry_date + 'T23:59:59') <= new Date() && (
                                                <div className="flex items-center gap-1">📄 {t('license_expiry')}: {new Date(r.license_expiry_date + 'T00:00:00').toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {user.role !== 'admin' && (
                        <div className="card mb-8">
                            <h3>{t('quick_actions')}</h3>
                            <div className="flex gap-2 flex-wrap">
                                <a href="/appointments" className="btn btn-accent btn-sm-inline">{t('book_appointment')}</a>
                                {user.role === 'doctor' && <a href="/documents" className="btn btn-secondary btn-sm-inline">{t('view_documents')}</a>}
                                {user.role === 'secretary' && <a href="/patients" className="btn btn-primary btn-sm-inline">{t('register_patient')}</a>}
                            </div>
                        </div>
                    )}

                    <div className="card mb-8 shadow-sm">
                        <h3 className="text-slate-800">{t('notifications')}</h3>
                        <p className="text-green-600 font-medium">✅ {t('system_operational')}</p>
                    </div>

                    {/* Requirements List (New Feature) */}
                    {(user.role === 'secretary' || user.role === 'doctor') && (
                        <div className="card col-span-full">
                            <div className="flex-between mb-4">
                                <h3>📋 {t('ongoing_requirements') || 'Requerimientos en Curso'}</h3>
                                <a href="/requests" className="btn btn-secondary text-sm">{t('view_all') || 'Ver Todos'}</a>
                            </div>
                            <RequirementsList user={user} />
                        </div>
                    )}
                </div>

                {
                    user.role === 'admin' && (
                        <div className="card mt-6">
                            <h3>{t('administration')}</h3>
                            <a href="/logs" className="btn btn-secondary btn-inline mt-2 mr-4 no-underline">
                                {t('view_audit_logs')}
                            </a>
                            <a href="/admin/users" className="btn btn-primary btn-inline mt-2 no-underline">
                                {t('manage_users')}
                            </a>
                        </div>
                    )
                }
            </main >
            <PatientHistoryModal
                isOpen={historyModal.open}
                onClose={() => setHistoryModal({ ...historyModal, open: false })}
                patientId={historyModal.patientId}
                patientName={historyModal.patientName}
            />
        </div >
    );
};

export default Dashboard;

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

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { showMessage } = useMessage();
    const { t, toggleLanguage, language } = useLanguage(); // Use hook
    const navigate = useNavigate();

    const [todayAppointments, setTodayAppointments] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(true);

    // Unified Action Modal (Sync with Appointments.jsx)
    const [actionModal, setActionModal] = useState({ open: false, appt: null });

    // Prescription Modal
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });

    // Payment Modal
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {}, apptId: null });

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
            reason = window.prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
            if (reason === null) return; // User cancelled the prompt
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
        if (!window.confirm(t('delete_error') || "Are you sure? This will remove the record mostly (Secretary Error).")) return;
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
        const reason = window.prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
        if (reason === null) return;
        if (!window.confirm(t('confirm_cancel'))) return;

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
        const interval = setInterval(fetchSchedule, 10000); // Poll every 10 seconds
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                        <hr style={{ borderColor: '#f1f5f9' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                            {/* Reschedule Button */}
                            <button className="btn btn-secondary" onClick={() => {
                                navigate('/appointments', { state: { rescheduleAppt: actionModal.appt } });
                            }}>
                                📅 {t('reschedule')}
                            </button>

                            {/* Action Buttons for Status */}
                            {actionModal.appt.status === 'pending' && (
                                <button className="btn" style={{ background: '#10b981', color: 'white' }} onClick={() => {
                                    handleUpdateStatus(actionModal.appt.id, 'confirmed');
                                    setActionModal({ ...actionModal, open: false });
                                }}>
                                    ✅ {t('confirm')}
                                </button>
                            )}

                            {(actionModal.appt.status === 'confirmed' || actionModal.appt.status === 'pending' || actionModal.appt.status === 'rescheduled') && (
                                <button className="btn" style={{ background: '#3b82f6', color: 'white' }} onClick={() => {
                                    handleUpdateStatus(actionModal.appt.id, 'completed');
                                    setActionModal({ ...actionModal, open: false });
                                }}>
                                    🏆 {t('complete')}
                                </button>
                            )}

                            <button className="btn" style={{ background: '#f59e0b', color: 'white' }} onClick={() => {
                                handleUpdateStatus(actionModal.appt.id, 'suspended');
                                setActionModal({ ...actionModal, open: false });
                            }}>
                                ⏸ {t('suspend')}
                            </button>

                            <button className="btn" style={{ background: '#64748b', color: 'white' }} onClick={() => {
                                handleUpdateStatus(actionModal.appt.id, 'absent');
                                setActionModal({ ...actionModal, open: false });
                            }}>
                                🚫 {t('absent')}
                            </button>
                        </div>

                        <hr style={{ borderColor: '#f1f5f9' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Cancel (Standard) */}
                            <button className="btn btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => {
                                handleCancel(actionModal.appt.id);
                                setActionModal({ ...actionModal, open: false });
                            }}>
                                ❌ {t('cancel')}
                            </button>

                            {/* Delete (Error) */}
                            {(user.role === 'admin' || user.role === 'secretary') && (
                                <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => {
                                    handleDelete(actionModal.appt.id);
                                    setActionModal({ ...actionModal, open: false });
                                }}>
                                    🗑 {t('delete_error')}
                                </button>
                            )}
                        </div>
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
                <div style={{ display: 'grid', gap: '1rem' }}>
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

            <main className="main-content">
                <header className="header-actions">
                    <h1 className="title">{t('dashboard')}</h1>
                    {user.role !== 'admin' && (
                        <a href="/appointments" className="btn btn-primary no-underline">{t('new_appointment')}</a>
                    )}
                </header>

                <div className="grid grid-cols-auto gap-6 text-left">
                    {user.role !== 'admin' && (
                        <div className="card">
                            <h3>{t('today_schedule')}</h3>
                            {loadingSchedule ? <p>{t('loading')}</p> : (
                                todayAppointments.length === 0 ?
                                    <p className="text-muted">{t('no_appointments_today')}</p> :
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {todayAppointments.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)).map(a => {
                                            let itemClass = "appointment-item";
                                            if (a.status === 'completed') itemClass += " status-completed";
                                            else if (a.status === 'cancelled') itemClass += " status-cancelled";
                                            else if (a.status === 'pending') itemClass += " status-pending";

                                            return (
                                                <li key={a.id} className={itemClass} onClick={() => setActionModal({ open: true, appt: a })} style={{ cursor: 'pointer' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                            {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: '#64748b' }}>
                                                                ({t(a.status)})
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '1rem' }}>{a.patient_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>w/ {a.doctor_name}</div>
                                                        {a.reason && (
                                                            <div style={{ fontSize: '0.75rem', color: '#6366f1', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                                                💬 {a.reason}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        {a.payment_status === 'paid' && <span title="Paid" style={{ color: '#10b981' }}>$✓</span>}
                                                        {a.payment_status === 'debt' && <span title="Debt" style={{ color: '#ef4444' }}>$!</span>}
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

                    {user.role !== 'admin' && (
                        <div className="card">
                            <h3>{t('quick_actions')}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <a href="/appointments" className="btn btn-accent" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}>{t('book_appointment')}</a>
                                {user.role === 'doctor' && <a href="/documents" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}>{t('view_documents')}</a>}
                                {user.role === 'secretary' && <a href="/patients" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}>{t('register_patient')}</a>}
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <h3>{t('notifications')}</h3>
                        <p>{t('system_operational')}</p>
                    </div>

                    {/* Requirements List (New Feature) */}
                    {(user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') && (
                        <div className="card" style={{ gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>📋 {t('ongoing_requirements') || 'Requerimientos en Curso'}</h3>
                                <a href="/requests" style={{ fontSize: '0.8rem' }} className="btn btn-secondary">{t('view_all') || 'Ver Todos'}</a>
                            </div>
                            <RequirementsList user={user} />
                        </div>
                    )}
                </div>

                {user.role === 'admin' && (
                    <div className="card" style={{ marginTop: '1.5rem' }}>
                        <h3>{t('administration')}</h3>
                        <a href="/logs" className="btn btn-secondary" style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none', marginRight: '1rem' }}>
                            {t('view_audit_logs')}
                        </a>
                        <a href="/admin/users" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none' }}>
                            {t('manage_users')}
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

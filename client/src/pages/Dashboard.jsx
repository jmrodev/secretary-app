import { useState, useEffect } from 'react';
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

    const [todayAppointments, setTodayAppointments] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { id, status, name }

    // Prescription Modal
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });

    // Payment Modal
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    useEffect(() => {
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

        fetchSchedule();
        const interval = setInterval(fetchSchedule, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, []);

    if (!user) return <div>{t('loading')}</div>;

    // State for cancellation reason
    const [cancellationReason, setCancellationReason] = useState("");

    const confirmAction = async () => {
        if (!pendingAction) return;
        try {
            await api.patch(`/appointments/${pendingAction.id}/status`, {
                status: pendingAction.status,
                reason: pendingAction.status === 'cancelled' ? cancellationReason : undefined
            });
            setTodayAppointments(prev => prev.map(p => p.id === pendingAction.id ? { ...p, status: pendingAction.status } : p));
            showMessage(`${t('appointments')} marked as ${pendingAction.status}`, 'success');
        } catch (err) {
            showMessage("Failed to update status", 'error');
        } finally {
            setModalOpen(false);
            setPendingAction(null);
            setCancellationReason(""); // Reset
        }
    };

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
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={t('confirm_action')}
                footer={
                    <>
                        <button onClick={() => setModalOpen(false)} className="btn btn-secondary">{t('cancel')}</button>
                        <button onClick={confirmAction} className="btn btn-primary" style={{ backgroundColor: pendingAction?.status === 'cancelled' ? '#ef4444' : '#22c55e' }}>
                            {t('confirm')}
                        </button>
                    </>
                }
            >
                <p>Are you sure you want to <strong>{pendingAction?.status === 'pending' ? 'restore' : 'mark'}</strong> the appointment for <strong>{pendingAction?.name}</strong> as <strong>{pendingAction?.status}</strong>?</p>

                {pendingAction?.status === 'cancelled' && (
                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Reason for cancellation:</label>
                        <textarea
                            className="input-field"
                            rows="3"
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Optional reason..."
                            autoFocus
                        />
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={prescribeModal.open}
                onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                title={`New Prescription for ${prescribeModal.patientName}`}
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
                        <textarea className="input-field" rows="4" value={prescribeModal.medications} onChange={e => setPrescribeModal({ ...prescribeModal, medications: e.target.value })} placeholder="e.g. Ibuprofen 600mg" autoFocus />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('instructions')}</label>
                        <textarea className="input-field" rows="3" value={prescribeModal.instructions} onChange={e => setPrescribeModal({ ...prescribeModal, instructions: e.target.value })} placeholder="e.g. Take every 8 hours with food." />
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
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="title">{t('dashboard')}</h1>
                    {user.role !== 'admin' && (
                        <a href="/appointments" className="btn btn-primary" style={{ textDecoration: 'none' }}>{t('new_appointment')}</a>
                    )}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {user.role !== 'admin' && (
                        <div className="card">
                            <h3>{t('today_schedule')}</h3>
                            {loadingSchedule ? <p>{t('loading')}</p> : (
                                todayAppointments.length === 0 ?
                                    <p className="text-muted">{t('no_appointments_today')}</p> :
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {todayAppointments.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)).map(a => {
                                            const time = new Date(a.appointment_date);
                                            const now = new Date();
                                            const isPast = time < now;
                                            const isCompleted = a.status === 'completed';
                                            const isCancelled = a.status === 'cancelled';

                                            let bg = 'transparent';
                                            let borderLeft = 'none';
                                            let opacity = 1;

                                            if (isCompleted) {
                                                opacity = 0.5;
                                                bg = '#f8fafc';
                                            } else if (isCancelled) {
                                                opacity = 0.5;
                                                bg = '#fef2f2';
                                            } else if (!isPast && a.status === 'pending') {
                                                bg = '#eff6ff';
                                                borderLeft = '4px solid #3b82f6';
                                            }

                                            const openConfirm = (status) => {
                                                setPendingAction({ id: a.id, status, name: a.patient_name });
                                                setModalOpen(true);
                                            };

                                            return (
                                                <li key={a.id} style={{
                                                    padding: '0.75rem',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    background: bg,
                                                    borderLeft: borderLeft,
                                                    opacity: opacity,
                                                    marginBottom: '0.5rem',
                                                    borderRadius: '0 4px 4px 0',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                            {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            {a.status === 'completed' && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'green' }}>({t('completed')})</span>}
                                                            {a.status === 'cancelled' && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'red' }}>({t('cancelled')})</span>}
                                                        </div>
                                                        <div style={{ fontSize: '1rem' }}>{a.patient_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>w/ {a.doctor_name}</div>
                                                    </div>

                                                    {(user.role === 'secretary' || user.role === 'doctor') && (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            {user.role === 'doctor' && (
                                                                <button onClick={() => setPrescribeModal({ open: true, apptId: a.id, patientName: a.patient_name, medications: '', instructions: '' })} title="Write Prescription" style={{ border: 'none', background: '#3b82f6', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Rx</button>
                                                            )}
                                                            {(user.role === 'secretary' || user.role === 'doctor') && (
                                                                <>
                                                                    {a.payment_status === 'paid' ? (
                                                                        <span title="Paid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', color: '#166534', fontSize: '0.8rem' }}>$✓</span>
                                                                    ) : (
                                                                        <button onClick={() => setPaymentModal({
                                                                            open: true,
                                                                            initialData: {
                                                                                type: 'income_patient',
                                                                                amount: '',
                                                                                description: `Consultation: ${a.patient_name}`,
                                                                                patientId: a.patient_id,
                                                                                patientName: a.patient_name,
                                                                                patientDni: a.patient_dni,
                                                                                patientUserId: a.patient_user_id,
                                                                                doctorId: a.doctor_id
                                                                            },
                                                                            apptId: a.id
                                                                        })} title={a.payment_status === 'partial' ? "Pay Remaining" : "Charge Payment"} style={{ border: 'none', background: a.payment_status === 'partial' ? '#ca8a04' : '#eab308', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>$</button>
                                                                    )}
                                                                </>
                                                            )}
                                                            {a.status === 'pending' && (
                                                                <>
                                                                    <button onClick={() => openConfirm('completed')} title="Mark Completed" style={{ border: 'none', background: '#dcfce7', color: '#166534', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                                                                    <button onClick={() => openConfirm('cancelled')} title="Cancel" style={{ border: 'none', background: '#fee2e2', color: '#991b1b', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                                                </>
                                                            )}
                                                            {(a.status === 'completed' || a.status === 'cancelled') && (
                                                                <button onClick={() => openConfirm('pending')} title="Restore to Pending" style={{ border: 'none', background: '#e2e8f0', color: '#475569', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
                                                            )}
                                                        </div>
                                                    )}
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
                                <h3>📋 Requerimientos en Curso</h3>
                                <a href="/requests" style={{ fontSize: '0.8rem' }} className="btn btn-secondary">Ver Todos</a>
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

import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import Modal from '../components/Modal';
import TransactionModal from '../components/TransactionModal';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { showMessage } = useMessage();

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
                const today = new Date().toISOString().split('T')[0];
                const todaysCalls = res.data.filter(a => a.appointment_date.startsWith(today));
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

    if (!user) return <div>Loading...</div>;

    const confirmAction = async () => {
        if (!pendingAction) return;
        try {
            await api.patch(`/appointments/${pendingAction.id}/status`, { status: pendingAction.status });
            setTodayAppointments(prev => prev.map(p => p.id === pendingAction.id ? { ...p, status: pendingAction.status } : p));
            showMessage(`Appointment marked as ${pendingAction.status}`, 'success');
        } catch (err) {
            showMessage("Failed to update status", 'error');
        } finally {
            setModalOpen(false);
            setPendingAction(null);
        }
    };

    const handleSavePrescription = async () => {
        try {
            await api.post('/medical/prescriptions', {
                appointment_id: prescribeModal.apptId,
                medications: prescribeModal.medications,
                instructions: prescribeModal.instructions
            });
            showMessage("Prescription created!", 'success');
            setPrescribeModal({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });
        } catch (err) {
            console.error(err);
            showMessage("Failed to create prescription", 'error');
        }
    };

    return (
        <div className="app-layout">
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Confirm Action"
                footer={
                    <>
                        <button onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={confirmAction} className="btn btn-primary" style={{ backgroundColor: pendingAction?.status === 'cancelled' ? '#ef4444' : '#22c55e' }}>
                            Confirm
                        </button>
                    </>
                }
            >
                <p>Are you sure you want to <strong>{pendingAction?.status === 'pending' ? 'restore' : 'mark'}</strong> the appointment for <strong>{pendingAction?.name}</strong> as <strong>{pendingAction?.status}</strong>?</p>
            </Modal>

            <Modal
                isOpen={prescribeModal.open}
                onClose={() => setPrescribeModal({ ...prescribeModal, open: false })}
                title={`New Prescription for ${prescribeModal.patientName}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setPrescribeModal({ ...prescribeModal, open: false })}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSavePrescription}>Create</button>
                    </>
                }
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">Medications (One per line)</label>
                        <textarea className="input-field" rows="4" value={prescribeModal.medications} onChange={e => setPrescribeModal({ ...prescribeModal, medications: e.target.value })} placeholder="e.g. Ibuprofen 600mg" autoFocus />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Instructions / Notes</label>
                        <textarea className="input-field" rows="3" value={prescribeModal.instructions} onChange={e => setPrescribeModal({ ...prescribeModal, instructions: e.target.value })} placeholder="e.g. Take every 8 hours with food." />
                    </div>
                </div>
            </Modal>

            <TransactionModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                initialData={paymentModal.initialData}
                onSuccess={async (data) => {
                    // Update appointment payment status if needed
                    if (paymentModal.apptId) {
                        try {
                            await api.patch(`/appointments/${paymentModal.apptId}/payment`, { status: data.status });
                            showMessage("Payment recorded and Appointment updated!", 'success');
                            // Refresh schedule
                            // Ideally trigger a context reload or refetch logic in existing layout
                            // For now reload window or just let the user see the log?
                            // Best: trigger fetchScheule again. But it is inside useEffect.
                            // We'll rely on the poll interval or user refresh.
                        } catch (e) { console.error(e); }
                    } else {
                        showMessage("Payment recorded!", 'success');
                    }
                }}
            />

            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Logged in as {user.username}</div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>{user.role}</div>
                </div>

                <nav>
                    <a href="#" className="sidebar-link active">Dashboard</a>
                    <a href="/profile" className="sidebar-link">My Profile</a>

                    {user.role === 'admin' && (
                        <>
                            <a href="/logs" className="sidebar-link">Audit Logs</a>
                            <a href="/admin/users" className="sidebar-link">User Management</a>
                        </>
                    )}

                    {(user.role === 'secretary' || user.role === 'doctor' || user.role === 'patient') && (
                        <a href="/documents" className="sidebar-link">Documents</a>
                    )}

                    {(user.role === 'secretary' || user.role === 'doctor') && (
                        <>
                            <a href="/appointments" className="sidebar-link">Appointments</a>
                            <a href="/patients" className="sidebar-link">Patients</a>
                            <a href="/finances" className="sidebar-link">Finances</a>
                        </>
                    )}

                    {(user.role === 'secretary') && (
                        <>
                            <a href="/doctors" className="sidebar-link">Doctors</a>
                        </>
                    )}

                    {user.role === 'doctor' && (
                        <>
                            <a href="#" className="sidebar-link">My Patients</a>
                            <a href="/rentals" className="sidebar-link">Rent Office</a>
                        </>
                    )}

                    {user.role === 'patient' && (
                        <>
                            <a href="#" className="sidebar-link">My Appointments</a>
                            <a href="#" className="sidebar-link">Medical History</a>
                        </>
                    )}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button onClick={logout} className="sidebar-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="title">Dashboard</h1>
                    {user.role !== 'admin' && (
                        <a href="/appointments" className="btn btn-primary" style={{ textDecoration: 'none' }}>New Appointment</a>
                    )}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {user.role !== 'admin' && (
                        <div className="card">
                            <h3>Today's Schedule</h3>
                            {loadingSchedule ? <p>Loading...</p> : (
                                todayAppointments.length === 0 ?
                                    <p className="text-muted">No appointments scheduled for today.</p> :
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {todayAppointments.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date)).map(a => {
                                            const time = new Date(a.appointment_date);
                                            const now = new Date();
                                            const isPast = time < now;
                                            const isCompleted = a.status === 'completed';
                                            const isCancelled = a.status === 'cancelled';

                                            // Determine if it's the "Next" appointment (first pending one)
                                            // Ideally we calculate this outside the map, but for simple display:
                                            // We'll style based on status first.

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
                                                // Highlight upcoming pending
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
                                                            {a.appointment_date.split('T')[1].substring(0, 5)}
                                                            {a.status === 'completed' && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'green' }}>(Completed)</span>}
                                                            {a.status === 'cancelled' && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: 'red' }}>(Cancelled)</span>}
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
                                                                                patientId: a.patient_id, // We need patient_id in data 
                                                                                patientName: a.patient_name,
                                                                                patientDni: a.patient_dni,
                                                                                patientUserId: a.patient_user_id,
                                                                                doctorId: a.doctor_id     // We need doctor_id
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
                            <h3>Quick Actions</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <a href="/appointments" className="btn btn-accent" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}>Book Appointment</a>
                                {user.role === 'doctor' && <a href="/documents" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}>View Documents</a>}
                                {user.role === 'secretary' && <a href="/patients" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}>Register Patient</a>}
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <h3>Notifications</h3>
                        <p>System operational.</p>
                    </div>
                </div>

                {user.role === 'admin' && (
                    <div className="card" style={{ marginTop: '1.5rem' }}>
                        <h3>Administration</h3>
                        <a href="/logs" className="btn btn-secondary" style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none', marginRight: '1rem' }}>
                            View Audit Logs
                        </a>
                        <a href="/admin/users" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none' }}>
                            Manage Users
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

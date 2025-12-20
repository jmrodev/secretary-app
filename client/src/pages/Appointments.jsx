import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TransactionModal from '../components/TransactionModal';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Form Stats
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments');
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await fetchAppointments();
            try {
                // Fetch doctors for selection
                const dRes = await api.get('/users/doctors');
                setDoctors(dRes.data);

                // Fetch patients if secretary
                if (user.role === 'secretary') {
                    const pRes = await api.get('/users/patients');
                    setPatients(pRes.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.role]);

    const handleBook = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await api.post('/appointments', {
                doctor_id: selectedDoctor,
                patient_id: user.role === 'secretary' ? selectedPatient : undefined,
                appointment_date: date,
                reason
            });
            setMessage('Appointment booked!');
            setShowForm(false);
            setReason('');
            setDate('');
            fetchAppointments();
        } catch (err) {
            setMessage('Failed to book appointment.');
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">Dashboard</a>
                    {(user.role === 'secretary' || user.role === 'admin' || user.role === 'doctor' || user.role === 'patient') && (
                        <a href="/documents" className="sidebar-link">Documents</a>
                    )}
                    <a href="#" className="sidebar-link active">Appointments</a>
                    {(user.role === 'secretary' || user.role === 'admin' || user.role === 'doctor') && (
                        <a href="/finances" className="sidebar-link">Finances</a>
                    )}
                </nav>
            </aside>
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="title" style={{ marginBottom: 0 }}>Appointments</h1>
                    {(user.role === 'patient' || user.role === 'secretary') && (
                        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancel Booking' : 'Book Appointment'}
                        </button>
                    )}
                </div>

                {message && <div style={{ padding: '1rem', background: message.includes('Failed') ? '#fee2e2' : '#dcfce7', color: message.includes('Failed') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

                {showForm && (
                    <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                        <h3>New Appointment</h3>
                        <form onSubmit={handleBook}>
                            <div className="input-group">
                                <label className="input-label">Select Doctor</label>
                                <select className="input-field" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required>
                                    <option value="">-- Select Doctor --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>
                                    ))}
                                </select>
                            </div>

                            {user.role === 'secretary' && (
                                <div className="input-group">
                                    <label className="input-label">Select Patient</label>
                                    <select className="input-field" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required>
                                        <option value="">-- Select Patient --</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="input-group">
                                <label className="input-label">Date & Time</label>
                                <input type="datetime-local" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Reason</label>
                                <textarea className="input-field" rows="3" value={reason} onChange={e => setReason(e.target.value)} required></textarea>
                            </div>

                            <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>Confirm Booking</button>
                        </form>
                    </div>
                )}

                <div className="card">
                    {appointments.length === 0 ? (
                        <p>No appointments found.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Doctor</th>
                                    <th style={{ padding: '1rem' }}>Patient</th>
                                    <th style={{ padding: '1rem' }}>Reason</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(app => (
                                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}>{new Date(app.appointment_date).toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>{app.doctor_name}</td>
                                        <td style={{ padding: '1rem' }}>{app.patient_name || 'N/A'}</td>
                                        <td style={{ padding: '1rem' }}>{app.reason}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.85rem',
                                                backgroundColor: app.status === 'confirmed' ? '#dcfce7' : (app.status === 'cancelled' ? '#fee2e2' : '#f1f5f9'),
                                                color: app.status === 'confirmed' ? '#166534' : (app.status === 'cancelled' ? '#991b1b' : '#475569')
                                            }}>
                                                {app.status || 'pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.85rem',
                                                    backgroundColor: app.payment_status === 'paid' ? '#dcfce7' : (app.payment_status === 'debt' ? '#fee2e2' : (app.payment_status === 'partial' ? '#fef9c3' : '#f1f5f9')),
                                                    color: app.payment_status === 'paid' ? '#166534' : (app.payment_status === 'debt' ? '#991b1b' : (app.payment_status === 'partial' ? '#854d0e' : '#475569'))
                                                }}>
                                                    {app.payment_status || 'pending'}
                                                </span>
                                                {(app.payment_status !== 'paid') && (user.role === 'secretary' || user.role === 'doctor') && (
                                                    <button
                                                        onClick={() => setPaymentModal({
                                                            open: true,
                                                            initialData: {
                                                                type: 'income_patient',
                                                                amount: '',
                                                                description: `Consultation: ${app.patient_name}`,
                                                                patientId: app.patient_id,
                                                                patientName: app.patient_name,
                                                                patientName: app.patient_name,
                                                                patientDni: app.patient_dni,
                                                                patientUserId: app.patient_user_id,
                                                                doctorId: app.doctor_id
                                                            },
                                                            apptId: app.id
                                                        })}
                                                        title="Charge Payment"
                                                        style={{ border: 'none', background: '#eab308', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}
                                                    >
                                                        $
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <TransactionModal
                    isOpen={paymentModal.open}
                    onClose={() => setPaymentModal({ ...paymentModal, open: false })}
                    initialData={paymentModal.initialData}
                    onSuccess={async (data) => {
                        if (paymentModal.apptId) {
                            try {
                                await api.patch(`/appointments/${paymentModal.apptId}/payment`, { status: data.status });
                                fetchAppointments();
                            } catch (e) { console.error(e); }
                        }
                    }}
                />
            </main >
        </div >
    );
};

export default Appointments;

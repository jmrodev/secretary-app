import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import TransactionModal from '../components/TransactionModal';
import Calendar from '../components/Calendar';
import DaySchedule from '../components/DaySchedule';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { t } = useLanguage();

    // View State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDoctorId, setViewDoctorId] = useState(''); // Filter for Calendar/Schedule

    // Form Stats
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    const [googleEvents, setGoogleEvents] = useState([]); // Store remote events

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments');
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        }
    };

    // Fetch Google Events when Doctor Filter changes or Date changes (for optimization, but let's do simple first)
    useEffect(() => {
        const fetchGoogle = async () => {
            if (!viewDoctorId) {
                setGoogleEvents([]);
                return;
            }

            try {
                // Fetch a broad range, e.g., current month +/- 1 month
                // Ideally this should react to Calendar's current view range.
                // For Minimum Viable: Fetch current month based on selectedDate.
                const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1).toISOString();
                const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0).toISOString();

                const res = await api.get(`/google/appointments?doctorId=${viewDoctorId}&start=${start}&end=${end}`);

                // Map to App format
                const mapped = res.data.events.map(e => ({
                    id: `goo_${e.id}`, // specific ID prefix
                    patient_name: e.summary || 'Google Event',
                    full_name: e.summary || 'Google Event', // For some views
                    appointment_date: e.start.dateTime || e.start.date, // Handle all-day too?
                    status: 'external', // New status for styling
                    doctor_id: Number(viewDoctorId),
                    source: 'google'
                }));
                setGoogleEvents(mapped);

            } catch (err) {
                console.log("Google Fetch skipped or failed (not connected?)");
                setGoogleEvents([]);
            }
        };
        fetchGoogle();
    }, [viewDoctorId, selectedDate, user.role]); // simplified dependency

    const fetchAllData = async () => {
        await fetchAppointments();
        try {
            // Fetch doctors for selection
            const dRes = await api.get('/users/doctors');
            setDoctors(dRes.data);

            // Fetch patients if secretary or doctor
            if (user.role === 'secretary' || user.role === 'doctor') {
                const pRes = await api.get('/users/patients');
                setPatients(pRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user.role]);

    // Auto-select doctor view if user is a doctor
    useEffect(() => {
        if (user.role === 'doctor' && doctors.length > 0) {
            // Find doctor profile linked to this user
            // Note: user object usually has user_id or id depending on auth flow. Standardize to user.user_id from context if available, or user.id.
            // Based on authController login: { user_id, username, role... }
            const myDoctorProfile = doctors.find(d => d.user_id === (user.user_id || user.id));
            if (myDoctorProfile) {
                setViewDoctorId(myDoctorProfile.id);
            }
        }
    }, [user, doctors]);

    // Computed appointments based on filter
    const currentDoctor = viewDoctorId ? doctors.find(d => d.id === Number(viewDoctorId)) : null;

    const localFiltered = viewDoctorId
        ? appointments.filter(app => app.doctor_id === Number(viewDoctorId))
        : appointments;

    // Merge
    const filteredAppointments = [...localFiltered, ...googleEvents];

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleSlotClick = (hour, existingAppt) => {
        if (existingAppt) {
            // View existing appointment details (could open a modal, currently just selected)
            // For now, if payment is pending, open payment modal like before?
            if (existingAppt.payment_status !== 'paid' && (user.role === 'secretary' || user.role === 'doctor')) {
                setPaymentModal({
                    open: true,
                    initialData: {
                        type: 'income_patient',
                        amount: '',
                        description: `Consultation: ${existingAppt.patient_name}`,
                        patientId: existingAppt.patient_id,
                        patientName: existingAppt.patient_name,
                        patientDni: existingAppt.patient_dni,
                        patientUserId: existingAppt.patient_user_id,
                        doctorId: existingAppt.doctor_id
                    },
                    apptId: existingAppt.id
                });
            }
        } else {
            // Book new appointment
            if (user.role === 'patient' || user.role === 'secretary' || user.role === 'doctor') {
                const newDate = new Date(selectedDate);
                newDate.setHours(hour, 0, 0, 0);

                // Adjust timezone to local ISO string for input
                const offset = newDate.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);

                setDate(localISOTime);
                // Pre-fill doctor if filtered
                if (viewDoctorId) setSelectedDoctor(viewDoctorId);
                setShowForm(true);
            }
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await api.post('/appointments', {
                doctor_id: selectedDoctor,
                patient_id: (user.role === 'secretary' || user.role === 'doctor') ? selectedPatient : undefined,
                appointment_date: date,
                reason
            });
            setMessage(t('appointment_booked'));
            setShowForm(false);
            setReason('');
            setDate('');
            fetchAppointments();
        } catch (err) {
            setMessage(t('failed_book'));
            console.error(err);
        }
    };

    const handleRatingChange = async (patientId, newRating) => {
        if (user.role !== 'secretary' && user.role !== 'doctor') return;
        try {
            await api.put(`/users/patients/${patientId}`, { financial_rating: newRating });
            // Optimistically update or refetch
            setAppointments(prev => prev.map(app =>
                app.patient_id === patientId ? { ...app, financial_rating: newRating } : app
            ));
        } catch (err) {
            console.error("Failed to update rating", err);
        }
    };

    if (loading) return <div>{t('loading')}</div>;

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('app_name')}</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">{t('dashboard')}</a>
                    {(user.role === 'secretary' || user.role === 'admin' || user.role === 'doctor' || user.role === 'patient') && (
                        <a href="/documents" className="sidebar-link">{t('documents')}</a>
                    )}
                    <a href="#" className="sidebar-link active">{t('appointments')}</a>
                    {(user.role === 'secretary' || user.role === 'admin' || user.role === 'doctor') && (
                        <a href="/finances" className="sidebar-link">{t('finances')}</a>
                    )}
                </nav>
            </aside>
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <h1 className="title" style={{ marginBottom: 0 }}>{t('appointments')}</h1>

                        {/* Doctor Filter for Secretary */}
                        {user.role === 'secretary' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t('filter_by_doctor')}:</label>
                                <select
                                    className="input-field"
                                    style={{ padding: '0.4rem', width: 'auto' }}
                                    value={viewDoctorId}
                                    onChange={(e) => setViewDoctorId(e.target.value)}
                                >
                                    <option value="">{t('all_doctors')}</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {(user.role === 'patient' || user.role === 'secretary' || user.role === 'doctor') && (
                        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                            {showForm ? t('cancel_booking') : t('new_appointment')}
                        </button>
                    )}
                </div>

                {message && <div style={{ padding: '1rem', background: message.includes('Failed') ? '#fee2e2' : '#dcfce7', color: message.includes('Failed') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

                {/* Calendar Layout */}
                <div className="appointments-grid">
                    <div className="calendar-section">
                        <Calendar
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            appointments={filteredAppointments}
                        />
                    </div>
                    <div className="schedule-section" style={{ position: 'relative', overflow: 'hidden' }}>
                        {currentDoctor && (
                            <div className="watermark">
                                {currentDoctor.full_name}
                            </div>
                        )}
                        <DaySchedule
                            date={selectedDate}
                            appointments={filteredAppointments}
                            onSlotClick={handleSlotClick}
                            onRatingChange={handleRatingChange}
                        />
                    </div>
                </div>

                {showForm && (
                    <div className="modal-overlay">
                        <div className="modal-content card" style={{ maxWidth: '500px', width: '100%', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3>{t('new_appointment')}</h3>
                                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <form onSubmit={handleBook}>
                                <div className="input-group">
                                    <label className="input-label">{t('doctors')}</label>
                                    {user.role === 'doctor' ? (
                                        <div className="input-field" style={{ background: '#e2e8f0', color: '#64748b' }}>
                                            {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'You'}
                                        </div>
                                    ) : (
                                        <select className="input-field" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required>
                                            <option value="">{t('select_doctor')}</option>
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {(user.role === 'secretary' || user.role === 'doctor') && (
                                    <div className="input-group">
                                        <label className="input-label">{t('patients')}</label>
                                        <select className="input-field" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required>
                                            <option value="">{t('select_patient')}</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="input-group">
                                    <label className="input-label">{t('date_time')}</label>
                                    <input type="datetime-local" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">{t('reason')}</label>
                                    <textarea className="input-field" rows="3" value={reason} onChange={e => setReason(e.target.value)} required></textarea>
                                </div>

                                <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>{t('confirm_booking')}</button>
                            </form>
                        </div>
                    </div>
                )}

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
            <style>{`
                .appointments-grid {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 1.5rem;
                    height: calc(100vh - 120px);
                }
                .calendar-section {
                    
                }
                .schedule-section {
                    overflow-y: auto;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-30deg);
                    font-size: 4rem;
                    font-weight: 900;
                    color: rgba(0,0,0,0.05);
                    pointer-events: none;
                    white-space: nowrap;
                    z-index: 0;
                    user-select: none;
                }
                @media (max-width: 900px) {
                    .appointments-grid {
                        grid-template-columns: 1fr;
                        height: auto;
                    }
                }
            `}</style>
        </div >
    );
};

export default Appointments;

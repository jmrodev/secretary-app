import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import TransactionModal from '../components/TransactionModal';
import Calendar from '../components/Calendar';
import DaySchedule from '../components/DaySchedule';
import PatientSearchSelect from '../components/PatientSearchSelect';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    // const [patients, setPatients] = useState([]); // Removed bulk fetch
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const navigate = useNavigate();
    const location = useLocation();

    // Reschedule Mode state (from navigation)
    const rescheduleAppt = location.state?.rescheduleAppt;

    const exitRescheduleMode = () => {
        navigate(location.pathname, { replace: true, state: {} });
    };

    // View State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDoctorId, setViewDoctorId] = useState(''); // Filter for Calendar/Schedule

    // Form Stats
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [bonified, setBonified] = useState(false); // [NEW] Bonificado
    const [message, setMessage] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    const [googleEvents, setGoogleEvents] = useState([]); // Store remote events
    const [holidays, setHolidays] = useState([]); // Store holidays

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments');
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await api.get('/holidays');
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
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
        await fetchHolidays();
        try {
            // Fetch doctors for selection
            const dRes = await api.get('/users/doctors');
            setDoctors(dRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user.role]);

    // Auto-select doctor view if user is a doctor OR if in Reschedule Mode
    useEffect(() => {
        if (rescheduleAppt) {
            setViewDoctorId(rescheduleAppt.doctor_id);
            return;
        }

        if (user.role === 'doctor' && doctors.length > 0) {
            const myDoctorProfile = doctors.find(d => d.user_id === (user.user_id || user.id));
            if (myDoctorProfile) {
                setViewDoctorId(myDoctorProfile.id);
            }
        }
    }, [user, doctors, rescheduleAppt]);

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

    // Action Modal State
    const [actionModal, setActionModal] = useState({ open: false, appt: null });

    const handleSlotClick = (hour, existingAppt) => {
        if (rescheduleAppt) {
            if (existingAppt) return; // Can't reschedule onto another appt

            const newDate = new Date(selectedDate);
            newDate.setHours(hour, 0, 0, 0);

            // Adjust timezone to local ISO string for input
            const offset = newDate.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);

            if (confirm(t('confirm_reschedule_to').replace('{date}', new Date(localISOTime).toLocaleString()))) {
                handleReschedule(rescheduleAppt.id, localISOTime);
                exitRescheduleMode();
            }
            return;
        }

        if (existingAppt) {
            setActionModal({ open: true, appt: existingAppt });
        } else {
            // Existing booking logic
            // ... (keep existing booking logic from original file here, or refactor. Since I can't see the original lines 140+ fully in context of replacement without copy-paste, I will assume I need to copy the `else` block content or just inject logic before it?) 
            // Better: Updating `handleSlotClick` entirely to use `actionModal` for existing.
            // The logic below recreates existing logic for "New Appointment" inside the else.

            // Check if selected date is a holiday
            // ... (rest of booking logic)
            // RE-INSERTING ORIGINAL BOOKING LOGIC BELOW:
            const dateStr = selectedDate.toISOString().split('T')[0];
            const isHoliday = holidays.find(h => h.date.startsWith(dateStr));
            if (isHoliday) {
                setMessage(`Cannot book on ${dateStr}: ${isHoliday.description}`);
                return;
            }

            if (user.role === 'patient' || user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') {
                const newDate = new Date(selectedDate);
                newDate.setHours(hour, 0, 0, 0);

                // Adjust timezone to local ISO string for input
                const offset = newDate.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);

                setDate(localISOTime);
                // Pre-fill doctor if filtered, otherwise reset to empty to allow selection
                if (viewDoctorId) {
                    setSelectedDoctor(viewDoctorId);
                } else {
                    setSelectedDoctor('');
                }
                setShowForm(true);
                setBonified(false);
            }
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
            setMessage(t('status_updated'));
            fetchAppointments();
            // Update actionModal appt state if open
            if (actionModal.open && actionModal.appt && actionModal.appt.id === id) {
                setActionModal(prev => ({
                    ...prev,
                    appt: { ...prev.appt, status }
                }));
            }
        } catch (err) {
            console.error(err);
            setMessage(t('failed_update'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('delete_error') || "Are you sure? This will remove the record mostly (Secretary Error).")) return;
        try {
            if (String(id).startsWith('goo_')) {
                // Handle Google Event Deletion
                const eventId = id.replace('goo_', '');
                await api.delete(`/google/appointments/${eventId}`, { data: { doctorId: viewDoctorId || selectedDoctor } });
                setMessage(t('appointment_deleted'));
                // Manually remove since it won't be in DB yet if we just added it, or force refetch
                setGoogleEvents(prev => prev.filter(e => e.id !== id));
            } else {
                // Standard DB Deletion
                await api.delete(`/appointments/${id}`);
                setMessage(t('appointment_deleted'));
                fetchAppointments();
            }
        } catch (err) {
            console.error(err);
            setMessage(t('failed_delete'));
        }
    };

    const handleReschedule = async (id, newDate) => {
        try {
            const isoDate = new Date(newDate).toISOString();
            await api.put(`/appointments/${id}`, { appointment_date: isoDate });
            setMessage(t('rescheduled_success'));
            fetchAppointments();
        } catch (err) {
            console.error(err);
            setMessage(t('failed_reschedule'));
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        setMessage('');

        // Client-side holiday check
        const selectedDatePart = date.split('T')[0];
        const isHoliday = holidays.find(h => h.date.startsWith(selectedDatePart));
        if (isHoliday) {
            setMessage(`Cannot book: ${isHoliday.description}`);
            return;
        }

        try {
            await api.post('/appointments', {
                doctor_id: selectedDoctor,
                patient_id: (user.role === 'secretary' || user.role === 'doctor') ? selectedPatient : undefined,
                appointment_date: new Date(date).toISOString(),
                reason,
                bonified // [NEW]
            });
            setMessage(t('appointment_booked'));
            setShowForm(false);
            setReason('');
            setDate('');
            fetchAppointments();
        } catch (err) {
            const serverError = err.response?.data?.error || err.response?.data;
            setMessage(serverError || t('failed_book'));
            console.error(err);
        }
    };

    const handleCancel = async (id) => {
        // [NEW] Prompt for cancellation reason
        const reason = window.prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
        if (reason === null) return; // User pressed cancel on the prompt

        if (!window.confirm(t('confirm_cancel'))) return;

        try {
            await api.put(`/appointments/${id}/status`, { status: 'cancelled', reason }); // Send reason
            setMessage(t('appointment_cancelled'));
            fetchAppointments();
        } catch (err) {
            setMessage(t('failed_cancel'));
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
            <Sidebar />
            <main className="main-content">
                {rescheduleAppt && (
                    <div className="reschedule-banner-container">
                        <div>
                            🚀 {t('rescheduling_mode')}: <strong>{rescheduleAppt.patient_name}</strong>. {t('reschedule_instruction')}
                        </div>
                        <button className="reschedule-exit-btn" onClick={exitRescheduleMode}>
                            {t('exit_reschedule')}
                        </button>
                    </div>
                )}

                <div className="flex-between mb-8">
                    <div className="flex items-center gap-8">
                        <h1 className="title mb-0">{t('appointments')}</h1>

                        {/* Doctor Filter for Secretary */}
                        {user.role === 'secretary' && (
                            <div className="active-filters">
                                <label className="font-medium text-sm">{t('filter_by_doctor')}:</label>
                                <select
                                    className="input-field w-auto p-2"
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

                {message && <div className={`alert-box ${message.includes('Failed') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

                {/* Calendar Layout */}
                <div className="appointments-grid">
                    <div className="calendar-section">
                        <Calendar
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            appointments={filteredAppointments}
                            holidays={holidays}
                        />
                    </div>
                    <div className="schedule-section-container">
                        {currentDoctor && (
                            <div className="watermark-text">
                                {currentDoctor.full_name}
                            </div>
                        )}
                        <DaySchedule
                            date={selectedDate}
                            appointments={filteredAppointments}
                            onSlotClick={handleSlotClick}
                            onRatingChange={handleRatingChange}
                            holidays={holidays}
                        />
                    </div>
                </div>

                {showForm && (
                    <div className="modal-overlay">
                        <div className="modal-content card" style={{ maxWidth: '500px', width: '100%', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3>{t('new_appointment')}</h3>
                                <button onClick={() => setShowForm(false)} className="close-btn">&times;</button>
                            </div>

                            <form onSubmit={handleBook}>
                                <div className="input-group">
                                    <label className="input-label">{t('doctors')}</label>
                                    {user.role === 'doctor' ? (
                                        <div className="input-field input-read-only">
                                            {doctors.find(d => d.id === Number(selectedDoctor))?.full_name || 'You'}
                                        </div>
                                    ) : (
                                        <select className="input-field" value={selectedDoctor || ''} onChange={e => setSelectedDoctor(e.target.value)} required>
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
                                        <PatientSearchSelect
                                            value={selectedPatient}
                                            onChange={setSelectedPatient}
                                            placeholder={t('select_patient')}
                                        />
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

                                <div className="input-group checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="bonified"
                                        checked={bonified}
                                        onChange={e => setBonified(e.target.checked)}
                                        className="w-auto"
                                    />
                                    <label htmlFor="bonified" className="input-label checkbox-label">
                                        {t('bonificado') || 'Bonificado (Free/Waived)'}
                                    </label>
                                </div>

                                <button type="submit" className="btn btn-accent w-full">{t('confirm_booking')}</button>
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
                            <p><strong>{t('reason')}:</strong> {actionModal.appt.reason || t('no_description') || 'No description'}</p>
                            <hr className="border-divider" />
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

                                {/* Reschedule Button */}
                                <button className="btn btn-secondary" onClick={() => {
                                    navigate('/appointments', { state: { rescheduleAppt: actionModal.appt } });
                                    setActionModal({ ...actionModal, open: false });
                                }}>
                                    📅 {t('reschedule')}
                                </button>

                                {/* Action Buttons for Status */}
                                {actionModal.appt.status === 'pending' && (
                                    <button className="btn btn-status-confirm" onClick={() => {
                                        handleUpdateStatus(actionModal.appt.id, 'confirmed');
                                        setActionModal({ ...actionModal, open: false });
                                    }}>
                                        ✅ {t('confirm')}
                                    </button>
                                )}

                                {(actionModal.appt.status === 'confirmed' || actionModal.appt.status === 'pending' || actionModal.appt.status === 'rescheduled') && (
                                    <button className="btn btn-status-complete" onClick={() => {
                                        handleUpdateStatus(actionModal.appt.id, 'completed');
                                        setActionModal({ ...actionModal, open: false });
                                    }}>
                                        🏆 {t('complete')}
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
                            </div>

                            <hr className="border-divider" />
                            <div className="grid-2-cols">
                                {/* Cancel (Standard) */}
                                <button className="btn btn-outline-danger" onClick={() => {
                                    handleCancel(actionModal.appt.id);
                                    setActionModal({ ...actionModal, open: false });
                                }}>
                                    ❌ {t('cancel')}
                                </button>

                                {/* Delete (Error) */}
                                {(user.role === 'admin' || user.role === 'secretary') && (
                                    <button className="btn btn-status-delete" onClick={() => {
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
            </main >
        </div >
    );
};

export default Appointments;

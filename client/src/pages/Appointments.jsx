import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import TransactionModal from '../components/TransactionModal';
import Calendar from '../components/Calendar';
import DaySchedule from '../components/DaySchedule';
import PatientSearchSelect from '../components/PatientSearchSelect';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import PatientHistoryModal from '../components/PatientHistoryModal';
import PatientEditModal from '../components/PatientEditModal';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    // const [patients, setPatients] = useState([]); // Removed bulk fetch
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { alert, confirm, prompt } = useModal();
    const navigate = useNavigate();
    const location = useLocation();

    // Reschedule Mode state (from navigation)
    const rescheduleAppt = location.state?.rescheduleAppt;

    const exitRescheduleMode = () => {
        navigate(location.pathname, { replace: true, state: {} });
    };

    // View State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDoctorId, setViewDoctorId] = useState(localStorage.getItem('last_selected_doctor_id') || ''); // Filter for Calendar/Schedule

    const [searchPatientId, setSearchPatientId] = useState(''); // [NEW] Filter by Patient
    const [patientAppointments, setPatientAppointments] = useState([]); // [NEW] List for specific patient
    const [patientApptLoading, setPatientApptLoading] = useState(false);



    // Form Stats
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedPatientData, setSelectedPatientData] = useState(null); // Full object
    const [missingData, setMissingData] = useState([]);
    const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('Consulta'); // Default reason
    const [bonified, setBonified] = useState(false); // [NEW] Bonificado
    const [message, setMessage] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    const [googleEvents, setGoogleEvents] = useState([]); // Store remote events
    const [holidays, setHolidays] = useState([]); // Store holidays

    // Action Modal State (Moved up or re-declared if missed)
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    // [prescribeModal needed here if not below]
    const [prescribeModal, setPrescribeModal] = useState({ open: false, apptId: null, patientName: '', medications: '', instructions: '' });

    // Next available slot modal
    const [nextSlotData, setNextSlotData] = useState(null); // { slot, breakSlot }
    const [showNextSlotModal, setShowNextSlotModal] = useState(false);

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

    // Handle persistence of doctor selection
    useEffect(() => {
        // ALWAYS save the view preference, even if empty (All Doctors)
        localStorage.setItem('last_selected_doctor_id', viewDoctorId);

        // Also sync selectedDoctor for the form if it was empty
        if (!selectedDoctor && viewDoctorId) setSelectedDoctor(viewDoctorId);
    }, [viewDoctorId]);

    useEffect(() => {
        // Always save the form doctor preference, even if empty (no doctor selected for form)
        localStorage.setItem('last_selected_doctor_id', selectedDoctor);
        // Also sync viewDoctorId for the view if it was empty
        if (!viewDoctorId) setViewDoctorId(selectedDoctor);
    }, [selectedDoctor]);

    // [NEW] Fetch patient specific appointments
    useEffect(() => {
        if (searchPatientId) {
            fetchPatientAppointments(searchPatientId);
        } else {
            setPatientAppointments([]);
        }
    }, [searchPatientId]);

    const fetchPatientAppointments = async (pId) => {
        setPatientApptLoading(true);
        try {
            const res = await api.get('/appointments', { params: { patientId: pId } });
            setPatientAppointments(res.data);
        } catch (err) {
            console.error(err);
            showMessage(t('error') || 'Error fetching history', 'error');
        } finally {
            setPatientApptLoading(false);
        }
    };

    const [doctorSchedule, setDoctorSchedule] = useState([]); // [NEW]

    // Fetch Google Events and Doctor Schedule
    useEffect(() => {
        const fetchGoogle = async () => {
            if (!viewDoctorId) {
                setGoogleEvents([]);
                setDoctorSchedule([]); // Reset
                return;
            }

            try {
                // Fetch Schedule
                const schedRes = await api.get(`/schedules/${viewDoctorId}`);
                setDoctorSchedule(schedRes.data);

                // Fetch Google Events
                const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1).toISOString();
                const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0).toISOString();
                const res = await api.get(`/google/appointments?doctorId=${viewDoctorId}&start=${start}&end=${end}`);

                // Map to App format
                const mapped = res.data.events.map(e => ({
                    id: `goo_${e.id}`,
                    patient_name: e.summary || 'Google Event',
                    full_name: e.summary || 'Google Event',
                    appointment_date: e.start.dateTime || e.start.date,
                    status: 'external',
                    doctor_id: Number(viewDoctorId),
                    source: 'google'
                }));
                setGoogleEvents(mapped);

            } catch (err) {
                console.log("Google/Schedule Fetch skipped or failed");
                if (err.response?.status !== 404) setGoogleEvents([]); // 404 might mean no schedule but keep connection?
            }
        };
        fetchGoogle();
    }, [viewDoctorId, selectedDate, user.role]);

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

    const localFiltered = appointments.filter(app => {
        if (searchPatientId) return app.patient_id === Number(searchPatientId);
        if (viewDoctorId) return app.doctor_id === Number(viewDoctorId);
        return true;
    });

    // Filter out Google events that are already in our local database (to avoid duplicates)
    const uniqueGoogleEvents = googleEvents.filter(ge => {
        const originalId = ge.id.replace('goo_', '');
        // Check if ANY local appointment has this google_event_id
        const exists = appointments.some(appt => appt.google_event_id === originalId);
        return !exists;
    });

    // Merge
    // Merge
    const filteredAppointments = [...localFiltered, ...uniqueGoogleEvents];

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleSlotClick = (hour, existingAppt, minute = 0) => {
        if (rescheduleAppt) {
            if (existingAppt) return; // Can't reschedule onto another appt

            const newDate = new Date(selectedDate);
            newDate.setHours(hour, minute, 0, 0);

            // Adjust timezone to local ISO string for input
            const offset = newDate.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(newDate - offset)).toISOString().slice(0, 16);

            if (await confirm(t('confirm_reschedule_to').replace('{date}', new Date(localISOTime).toLocaleString()))) {
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
            // Robust Date Comparison (Local YYYY-MM-DD)
            const toLocalYMD = (d) => {
                const date = new Date(d);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            };

            const selectedYMD = toLocalYMD(selectedDate);
            const isHoliday = holidays.find(h => {
                // h.date comes as ISO string e.g. 2026-05-01T03:00:00.000Z. 
                // We create a Date object from it, which converts to Local Time.
                // Then we extract YMD.
                return toLocalYMD(h.date) === selectedYMD;
            });

            if (isHoliday) {
                setMessage(`Cannot book on ${selectedYMD}: ${isHoliday.description}`);
                return;
            }

            if (user.role === 'patient' || user.role === 'secretary' || user.role === 'doctor' || user.role === 'admin') {
                const newDate = new Date(selectedDate);
                newDate.setHours(hour, minute, 0, 0);

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

    const handleDelete = async (id, status) => {
        if (status === 'attended') return alert(t('cannot_delete_attended') || "Cannot delete an appointment that has been attended.");
        if (!await confirm(t('confirm_delete_appointment') || "Are you sure? This will remove the record mostly (Secretary Error).")) return;
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
            const serverError = err.response?.data?.error || err.response?.data;
            setMessage(serverError || t('failed_delete'));
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
                reason: reason || 'Consulta', // Ensure it sends 'Consulta' if empty for some reason
                bonified // [NEW]
            });
            setMessage(t('appointment_booked'));
            setShowForm(false);
            setReason('Consulta'); // Reset to default 'Consulta'
            setDate('');
            fetchAppointments();
        } catch (err) {
            const serverError = err.response?.data?.error || err.response?.data;
            setMessage(serverError || t('failed_book'));
            console.error(err);
        }
    };

    const handleCancel = async (id) => {
        const reason = await prompt(t('cancellation_reason_prompt') || "Please enter a reason for cancellation:");
        if (!reason) return;
        if (!await confirm(t('confirm_cancel'))) return;

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

    const handleNextFreeSlot = async () => {
        const docId = viewDoctorId || selectedDoctor;
        if (!docId) {
            showMessage("Por favor, selecciona un médico primero para buscar turnos.", 'warning');
            return;
        }

        try {
            setLoading(true);
            const res = await api.get('/appointments/next-free', { params: { doctor_id: docId } });
            setLoading(false);

            if (res.data && (res.data.slot || res.data.breakSlot)) {
                setNextSlotData(res.data);
                setShowNextSlotModal(true);
            } else {
                showMessage("No se encontraron turnos libres cercanos.", 'info');
            }
        } catch (err) {
            setLoading(false);
            console.error(err);
            showMessage("Error buscando turno libre o no encontrados.", 'error');
        }
    };

    const confirmNextSlot = (dateIso) => {
        const slotDate = new Date(dateIso);
        // Adjust timezone to local ISO string for input
        const offset = slotDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(slotDate - offset)).toISOString().slice(0, 16);

        setDate(localISOTime);
        setSelectedDoctor(viewDoctorId || selectedDoctor);
        setShowNextSlotModal(false);
        setShowForm(true);
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
                        <div className="flex gap-4">
                            {/* Patient Search Filter */}
                            <div style={{ width: '300px' }}>
                                <PatientSearchSelect
                                    value={searchPatientId}
                                    placeholder={t('search_patient_appointment') || "🔍 Buscador..."}
                                    onChange={(val) => setSearchPatientId(val)}
                                    onCreatePatient={() => {
                                        setEditPatientModalOpen(true);
                                    }}
                                />
                            </div>
                            <button className="btn btn-secondary flex items-center gap-2" onClick={handleNextFreeSlot} title="Buscar el próximo turno libre disponible">
                                🔍 {t('next_free_slot') || 'Próximo Libre'}
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                                {showForm ? t('cancel_booking') : t('new_appointment')}
                            </button>
                        </div>
                    )}
                </div>



                {message && <div className={`alert-box ${message.includes('Failed') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

                {/* Calendar Layout */}
                {searchPatientId ? (
                    /* PATIENT APPOINTMENT LIST VIEW */
                    <div className="patient-history-view animate-fade-in card p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-700">
                                {t('results_for')}: {patientAppointments[0]?.patient_name || t('patient')}
                            </h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSearchPatientId('')}>
                                🔙 {t('back_to_calendar')}
                            </button>
                        </div>

                        {patientApptLoading ? <p>Cargando...</p> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Future Appointments */}
                                <div className="card bg-blue-50/50 border-blue-100">
                                    <h3 className="mb-4 text-blue-600 font-bold border-b border-blue-200 pb-2">📅 {t('upcoming_appointments')}</h3>
                                    {patientAppointments.filter(a => new Date(a.appointment_date) >= new Date()).length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-slate-500 text-lg mb-4">
                                                {t('no_patient_history')}
                                            </p>
                                            <p className="text-sm text-blue-600 mb-2 font-medium">
                                                {t('create_one_now')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {patientAppointments.filter(a => new Date(a.appointment_date) >= new Date()).map(appt => (
                                                <div key={appt.id} className="p-3 bg-white border border-blue-100 rounded-lg shadow-sm flex justify-between items-center">
                                                    <div>
                                                        <div className="font-bold text-slate-800">{new Date(appt.appointment_date).toLocaleDateString()} {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div className="text-slate-600 text-sm">Dr. {appt.doctor_name}</div>
                                                        <div className="text-xs text-slate-500 italic">{appt.reason}</div>
                                                    </div>
                                                    <span className={`tag tag-${appt.status === 'confirmed' ? 'green' : 'amber'}`}>
                                                        {t(appt.status)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        className="btn btn-primary mt-4 w-full"
                                        onClick={() => {
                                            setSelectedPatient(searchPatientId);
                                            setShowForm(true);
                                        }}
                                    >
                                        + {t('new_appointment') || 'Nuevo Turno'}
                                    </button>
                                </div>

                                {/* Past History */}
                                <div>
                                    <h3 className="mb-4 text-slate-600 font-bold border-b pb-2">📜 {t('history')}</h3>
                                    {patientAppointments.filter(a => new Date(a.appointment_date) < new Date()).length === 0 ? (
                                        <p className="text-muted italic text-sm">{t('no_history')}</p>
                                    ) : (
                                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                            {patientAppointments.filter(a => new Date(a.appointment_date) < new Date()).map(appt => (
                                                <div key={appt.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg hover:shadow-md transition-all">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-semibold text-slate-700">{new Date(appt.appointment_date).toLocaleDateString()}</span>
                                                        <span className={`text-xs uppercase font-bold text-${appt.status === 'completed' ? 'green-600' : 'slate-500'}`}>
                                                            {t(appt.status)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-600 mb-2">Dr. {appt.doctor_name}</div>
                                                    <div className="text-sm italic text-slate-500 mb-3">"{appt.reason}"</div>

                                                    <div className="flex gap-2 justify-end border-t border-slate-200 pt-2">
                                                        <button
                                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                                            onClick={() => {
                                                                setSelectedPatient(searchPatientId);
                                                                setReason(appt.reason); // Pre-fill reason
                                                                setShowForm(true);
                                                            }}
                                                            title={t('repeat_appointment')}
                                                        >
                                                            🔄 {t('repeat_appointment')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                ) : (
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
                                appointments={currentDoctor ? localFiltered.filter(a => a.doctor_id === currentDoctor.id) : localFiltered}
                                onSlotClick={handleSlotClick}
                                onRatingChange={handleRatingChange}
                                doctor={currentDoctor}
                                schedule={doctorSchedule} // [NEW] Pass schedule
                            />
                        </div>
                    </div>
                )
                }

                <Modal
                    isOpen={showForm}
                    onClose={() => setShowForm(false)}
                    title={t('new_appointment')}
                >
                    <form onSubmit={handleBook} id="new-appointment-form">
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
                                    placeholder={t('select_patient')}
                                    onCreatePatient={async (name) => {
                                        // Open Create Patient Modal with pre-filled name
                                        // We need to set state to open the modal
                                        // Ensure PatientEditModal is ready for creation (usually patient=null or {full_name: name})
                                        setSelectedPatientData({ full_name: name }); // Pre-fill name if supported by modal
                                        setEditPatientModalOpen(true);
                                    }}
                                    onChange={(val, obj) => {
                                        setSelectedPatient(val);
                                        setSelectedPatientData(obj);

                                        // Specific Check
                                        if (obj) {
                                            const missing = [];
                                            if (!obj.dni) missing.push(t('dni') || 'DNI');
                                            if (!obj.phone) missing.push(t('phone') || 'Teléfono');
                                            if (!obj.email) missing.push('Email');
                                            if (!obj.address) missing.push(t('address') || 'Dirección');
                                            if (!obj.insurance_name && !obj.insurance && !obj.insurance_id) missing.push('Obra Social');

                                            setMissingData(missing);
                                        } else {
                                            setMissingData([]);
                                        }
                                    }}
                                />
                                {missingData.length > 0 && (
                                    <div className="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded border border-yellow-200 flex flex-between items-center">
                                        <span>
                                            ⚠️ <strong>Datos incompletos:</strong> {missingData.join(', ')}.
                                        </span>
                                        <button
                                            type="button"
                                            className="ml-2 text-blue-600 underline font-bold"
                                            onClick={() => setEditPatientModalOpen(true)}
                                        >
                                            Completar
                                        </button>
                                    </div>
                                )}
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
                        <div className="mt-4 text-right">
                            <button type="submit" className="btn btn-accent w-full">{t('confirm_booking')}</button>
                        </div>
                    </form>
                </Modal>

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
                {
                    actionModal.open && actionModal.appt && (
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
                                <hr className="border-divider" />

                                {/* Doctor Workflow Panel (Synced with Dashboard.jsx) */}
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
                                                id="quick-evolution-note-appt"
                                            />
                                            <button
                                                className="btn btn-secondary btn-sm px-3"
                                                title={t('save_note') || "Guardar Nota"}
                                                onClick={async () => {
                                                    const note = document.getElementById('quick-evolution-note-appt').value;
                                                    try {
                                                        await api.put(`/appointments/${actionModal.appt.id}`, {
                                                            reason: note,
                                                            appointment_date: actionModal.appt.appointment_date
                                                        });
                                                        showMessage(t('note_saved') || 'Nota actualizada', 'success');
                                                        setActionModal(prev => ({
                                                            ...prev,
                                                            appt: { ...prev.appt, reason: note }
                                                        }));
                                                        fetchAppointments();
                                                    } catch (e) { console.error(e); }
                                                }}
                                            >
                                                💾
                                            </button>
                                        </div>
                                    </div>
                                )}

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

                                            {/* Actions - Hide if Completed */}
                                            {actionModal.appt.status !== 'completed' && (
                                                <>
                                                    {/* Arrived Button */}
                                                    {actionModal.appt.status !== 'arrived' && (
                                                        <button className="btn btn-primary" onClick={() => {
                                                            handleUpdateStatus(actionModal.appt.id, 'arrived');
                                                            setActionModal({ ...actionModal, open: false });
                                                        }}>
                                                            🏥 {t('patient_arrived') || 'Asistió (En Sala)'}
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

                                        {/* Cancel/Delete - Hide if Completed */}
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
                                    </>
                                )}
                            </div>
                        </Modal>
                    )
                }




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

                <PatientHistoryModal
                    isOpen={historyModal.open}
                    onClose={() => setHistoryModal({ ...historyModal, open: false })}
                    patientId={historyModal.patientId}
                    patientName={historyModal.patientName}
                />

                <Modal
                    isOpen={showNextSlotModal}
                    onClose={() => setShowNextSlotModal(false)}
                    title="Próximos Turnos Libres"
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-slate-600 mb-2">Se han encontrado las siguientes opciones:</p>

                        {nextSlotData?.slot && (
                            <button
                                className="btn btn-primary p-4 flex justify-between items-center text-lg"
                                onClick={() => confirmNextSlot(nextSlotData.slot)}
                            >
                                <span>📅 Turno Normal</span>
                                <span className="font-bold">{new Date(nextSlotData.slot).toLocaleString()}</span>
                            </button>
                        )}

                        {nextSlotData?.breakSlot && (
                            <button
                                className="btn bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 p-4 flex justify-between items-center text-lg mt-2"
                                onClick={() => confirmNextSlot(nextSlotData.breakSlot)}
                            >
                                <span className="flex items-center gap-2">☕ Turno Descanso <span className="text-xs bg-amber-600 text-white px-2 rounded">Opcional</span></span>
                                <span className="font-bold">{new Date(nextSlotData.breakSlot).toLocaleString()}</span>
                            </button>
                        )}

                        <button className="btn btn-secondary mt-4" onClick={() => setShowNextSlotModal(false)}>Cancelar</button>
                    </div>
                </Modal>

                {
                    editPatientModalOpen && selectedPatientData && (
                        <PatientEditModal
                            isOpen={editPatientModalOpen}
                            onClose={() => setEditPatientModalOpen(false)}
                            patient={selectedPatientData}
                            onUpdate={(updatedData) => {
                                setSelectedPatient(updatedData.id); // [FIX] Auto-select the ID (crucial for form)
                                setSelectedPatientData(updatedData);

                                // Re-check missing
                                const missing = [];
                                if (!updatedData.dni) missing.push(t('dni') || 'DNI');
                                if (!updatedData.phone) missing.push(t('phone') || 'Teléfono');
                                if (!updatedData.email) missing.push('Email');
                                if (!updatedData.address) missing.push(t('address') || 'Dirección');
                                if (!updatedData.insurance_name && !updatedData.insurance && !updatedData.insurance_id) missing.push('Obra Social');
                                setMissingData(missing);
                            }}
                        />
                    )
                }
            </main >
        </div >
    );
};

export default Appointments;

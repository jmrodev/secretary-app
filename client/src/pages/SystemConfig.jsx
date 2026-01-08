import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';
import Sidebar from '../components/Sidebar';

const SystemConfig = () => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { settings, updateSetting } = useConfig();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false); // Changed default to false, load on select
    const [syncLogs, setSyncLogs] = useState([]);

    // Doctor Selection State
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        if (status === 'success') {
            showMessage('Google Account Connected Successfully', 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (status === 'error') {
            showMessage('Failed to connect Google Account', 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        loadDoctors();
    }, []);

    // Re-check status when doctor changes
    useEffect(() => {
        if (selectedDoctor) {
            checkStatus(selectedDoctor);
        } else {
            setConnected(false);
        }
    }, [selectedDoctor]);

    const loadDoctors = async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);

            // Auto-select if current user is doctor
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === 'doctor') {
                    // Find doctor profile by user_id
                    const myDoc = res.data.find(d => d.user_id === user.user_id || d.user_id === user.id);
                    if (myDoc) setSelectedDoctor(myDoc.id);
                }
            }
        } catch (err) {
            console.error("Failed to load doctors", err);
        }
    };

    const checkStatus = async (doctorId) => {
        setLoading(true);
        try {
            const res = await api.get(`/google/status?doctorId=${doctorId}`);
            setConnected(res.data.connected);
        } catch (err) {
            console.error(err);
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!selectedDoctor) return alert("Select a doctor first");
        try {
            const res = await api.get(`/google/auth-url?doctorId=${selectedDoctor}`);
            window.location.href = res.data.url;
        } catch (err) {
            showMessage('Failed to initiate connection. Check server .env', 'error');
            console.error(err);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Are you sure? This will stop syncing.")) return;
        try {
            await api.post('/google/disconnect', { doctorId: selectedDoctor });
            setConnected(false);
            showMessage('Disconnected', 'success');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <h1 className="title">System Configuration</h1>

                <h1 className="title">System Configuration</h1>

                <div className="card mb-8">
                    <h3>General Settings</h3>
                    <div className="input-group-row-center gap-4">
                        <input
                            type="checkbox"
                            id="opt-rentals"
                            checked={settings.enable_office_rentals === 'true'}
                            onChange={(e) => updateSetting('enable_office_rentals', e.target.checked)}
                            className="w-5 h-5"
                        />
                        <label htmlFor="opt-rentals" className="input-label m-0">
                            Enable Office Rentals (Alquiler de Consultorios)
                        </label>
                    </div>
                    <p className="text-sm-muted">
                        If disabled, the "Rentals" menu item will be hidden from the sidebar.
                    </p>
                </div>

                {/* Holiday Management */}
                <HolidayManager />

                <div className="card">
                    <h3>Google Integration (Per Doctor)</h3>
                    <p className="text-muted mb-6">
                        Select a doctor to connect their specific Google Calendar/Contacts.
                    </p>

                    <div className="mb-6">
                        <label className="block mb-2 font-bold">Select Doctor:</label>
                        <select
                            className="form-control max-w-300"
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                        >
                            <option value="">-- Choose Doctor --</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {!selectedDoctor ? (
                        <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>Please select a doctor to configure.</p>
                    ) : (
                        <>
                            {loading ? <p>Checking status...</p> : (
                                <div className="flex-center gap-4 mb-8">
                                    <div className={`status-badge ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {connected ? '✅ Google Connected' : '❌ Not Connected'}
                                    </div>

                                    {connected ? (
                                        <button className="btn btn-secondary" onClick={handleDisconnect}>Disconnect</button>
                                    ) : (
                                        <button className="btn btn-primary" onClick={handleConnect}>Connect Google Account</button>
                                    )}
                                </div>
                            )}

                            {connected && (
                                <div className="border-t-divider pt-4">

                                    {/* Calendar Section */}
                                    <div className="mt-4">
                                        <h4>Google Calendar Integration</h4>
                                        <p className="text-sm-muted mb-4">
                                            Manage appointments and verify conflicts.
                                        </p>
                                        <div className="flex gap-4">
                                            <button className="btn btn-secondary" onClick={async () => {
                                                try {
                                                    const res = await api.get(`/google/appointments?doctorId=${selectedDoctor}`);
                                                    const events = res.data.events || [];
                                                    setSyncLogs(prev => [...prev, `[CALENDAR][Doc ${selectedDoctor}] Found ${events.length} future events.`]);
                                                    events.forEach(e => {
                                                        setSyncLogs(prev => [...prev, `📅 ${e.start.dateTime || e.start.date} - ${e.summary}`]);
                                                    });
                                                    alert(`Found ${events.length} events. Check logs below.`);
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Error: ' + (err.response?.data?.error || err.message));
                                                }
                                            }}>
                                                📅 List My Appointments
                                            </button>

                                            <button className="btn btn-secondary" onClick={async () => {
                                                const summary = prompt("Appointment Title:");
                                                if (!summary) return;
                                                try {
                                                    // Create an event for tomorrow at 10am
                                                    const tomorrow = new Date();
                                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                                    tomorrow.setHours(10, 0, 0, 0);
                                                    const endTime = new Date(tomorrow);
                                                    endTime.setHours(11, 0, 0, 0);

                                                    await api.post('/google/appointments', {
                                                        doctorId: selectedDoctor,
                                                        summary,
                                                        description: 'Created via Secretary App',
                                                        startTime: tomorrow.toISOString(),
                                                        endTime: endTime.toISOString()
                                                    });
                                                    alert(`Event created for tomorrow!`);
                                                    setSyncLogs(prev => [...prev, `[CALENDAR] Created event: ${summary}`]);
                                                } catch (err) {
                                                    console.error(err);
                                                    const msg = err.response?.data?.error || err.message || JSON.stringify(err);
                                                    if (msg && msg.toString().includes('Enable it by visiting')) {
                                                        alert("⚠️ ACTION REQUIRED: Google Calendar API is disabled.\n\n" +
                                                            "1. Go to Google Cloud Console -> APIs & Services -> Library.\n" +
                                                            "2. Search for 'Google Calendar API'.\n" +
                                                            "3. Click ENABLE.\n\n" +
                                                            "(Don't click the link in the error, it often fails!)");
                                                    } else {
                                                        alert('Error: ' + msg);
                                                    }
                                                }
                                            }}>
                                                ➕ Test Create Appointment
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contacts Section */}
                                    <div className="mt-6 border-t-divider pt-4">
                                        <h4>Google Contacts Sync</h4>
                                        <p className="text-sm-muted mb-4">
                                            Import your Google Contacts into the patient database.
                                        </p>
                                        <button className="btn btn-primary" onClick={async () => {
                                            if (!confirm("This will import contacts from the selected Google account. Continue?")) return;
                                            setLoading(true);
                                            try {
                                                const res = await api.post('/google/import', { doctorId: selectedDoctor });
                                                alert(`Import Complete!\nCreated: ${res.data.results.created}\nUpdated: ${res.data.results.updated}`);
                                                setSyncLogs(prev => [...prev, `[IMPORT] Created: ${res.data.results.created}, Updated: ${res.data.results.updated}`]);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Import Failed: ' + (err.response?.data?.error || err.message));
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}>
                                            📥 Import Contacts from Google
                                        </button>
                                    </div>


                                    {syncLogs.length > 0 && (
                                        <div className="logs-container">
                                            {syncLogs.map((log, i) => (
                                                <div key={i}>{log}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <div className="setup-instructions">
                        <h4>Setup Instructions</h4>
                        <ol className="ml-6 mt-2 text-slate-600">
                            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-link">Google Cloud Console</a>.</li>
                            <li>Create a Project.</li>
                            <li><strong>CRITICAL:</strong> Enable the following APIs (Library &rarr; Search):
                                <ul className="ml-4 mt-1 mb-2">
                                    <li><a href="https://console.cloud.google.com/apis/library/people.googleapis.com" target="_blank" rel="noreferrer" className="text-blue-500">Google People API</a> (for Contacts)</li>
                                    <li><a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer" className="text-blue-500">Google Calendar API</a> (for Appointments)</li>
                                </ul>
                            </li>
                            <li>Create <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-link">OAuth 2.0 Credentials</a> (Client ID & Secret).</li>
                            <li>Set Redirect URI to: <code>http://localhost:5000/api/google/callback</code></li>
                            <li>Add these to your <code>server/.env</code> file:</li>
                            <pre className="code-block mt-2">
                                GOOGLE_CLIENT_ID=your_id{'\n'}
                                GOOGLE_CLIENT_SECRET=your_secret{'\n'}
                                GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
                            </pre>
                        </ol>
                    </div>
                </div>
            </main >
        </div >
    );
};


const HolidayManager = () => {
    const [holidays, setHolidays] = useState([]);
    const [newDate, setNewDate] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const { showMessage } = useMessage();

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        try {
            const res = await api.get('/holidays');
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to load holidays", err);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/holidays', { date: newDate, description: newDesc });
            showMessage('Holiday added', 'success');
            setNewDate('');
            setNewDesc('');
            loadHolidays();
        } catch (err) {
            showMessage(err.response?.data || 'Failed to add', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this holiday?")) return;
        try {
            await api.delete(`/holidays/${id}`);
            loadHolidays();
        } catch (err) {
            console.error(err);
        }
    };

    // Format date for display (UTC slice fix not needed if string is YYYY-MM-DD from DB)
    // DB returns YYYY-MM-DDT00:00:00.000Z usually. Use local split.
    const formatDate = (isoString) => {
        if (!isoString) return '';
        return isoString.split('T')[0];
    };

    return (
        <div className="card mb-8">
            <h3>Establecer Feriados / Días Cerrados</h3>
            <p className="text-sm-muted">
                Los días agregados aquí bloquearán la creación de turnos.
            </p>

            <form onSubmit={handleAdd} className="flex gap-4 items-end mb-6">
                <div className="flex-1">
                    <label className="input-label">Fecha</label>
                    <input type="date" className="input-field" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                </div>
                <div className="flex-2">
                    <label className="input-label">Descripción</label>
                    <input type="text" className="input-field" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ej. Navidad" required />
                </div>
                <button type="submit" className="btn btn-primary">Agregar</button>
            </form>

            {holidays.length === 0 ? <p className="text-muted">No hay feriados configurados.</p> : (
                <ul className="list-none p-0">
                    {holidays.map(h => (
                        <li key={h.id} className="holiday-list-item">
                            <span><strong>{formatDate(h.date)}</strong>: {h.description}</span>
                            <button onClick={() => handleDelete(h.id)} className="btn-text-danger">Eliminar</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SystemConfig;

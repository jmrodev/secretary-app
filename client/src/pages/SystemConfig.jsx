import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';

const SystemConfig = () => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
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
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('app_name')}</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">{t('dashboard')}</a>
                    <a href="#" className="sidebar-link active">Sys Config</a>
                </nav>
            </aside>
            <main className="main-content">
                <h1 className="title">System Configuration</h1>

                <div className="card">
                    <h3>Google Integration (Per Doctor)</h3>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                        Select a doctor to connect their specific Google Calendar/Contacts.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Doctor:</label>
                        <select
                            className="form-control"
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            style={{ maxWidth: '300px' }}
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        background: connected ? '#dcfce7' : '#fee2e2',
                                        color: connected ? '#166534' : '#991b1b',
                                        fontWeight: 'bold'
                                    }}>
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
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>

                                    {/* Calendar Section */}
                                    <div style={{ marginTop: '1rem' }}>
                                        <h4>Google Calendar Integration</h4>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                                            Manage appointments and verify conflicts.
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
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
                                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                        <h4>Google Contacts Sync</h4>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
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
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '0.5rem',
                                            background: '#1e293b',
                                            color: '#f8fafc',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            fontFamily: 'monospace',
                                            maxHeight: '250px',
                                            overflowY: 'auto'
                                        }}>
                                            {syncLogs.map((log, i) => (
                                                <div key={i}>{log}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4>Setup Instructions</h4>
                        <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem', color: '#475569' }}>
                            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Google Cloud Console</a>.</li>
                            <li>Create a Project.</li>
                            <li><strong>CRITICAL:</strong> Enable the following APIs (Library &rarr; Search):
                                <ul style={{ marginLeft: '1rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                                    <li><a href="https://console.cloud.google.com/apis/library/people.googleapis.com" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Google People API</a> (for Contacts)</li>
                                    <li><a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Google Calendar API</a> (for Appointments)</li>
                                </ul>
                            </li>
                            <li>Create <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>OAuth 2.0 Credentials</a> (Client ID & Secret).</li>
                            <li>Set Redirect URI to: <code>http://localhost:5000/api/google/callback</code></li>
                            <li>Add these to your <code>server/.env</code> file:</li>
                            <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem' }}>
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

export default SystemConfig;

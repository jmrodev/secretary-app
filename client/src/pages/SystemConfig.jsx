import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';
import Sidebar from '../components/Sidebar';
import QRCodeModal from '../components/QRCodeModal';
import DoctorScheduleSettings from '../components/DoctorScheduleSettings'; // [NEW]
import { useModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';

const SystemConfig = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { alert, confirm, prompt } = useModal();
    const { settings, updateSetting } = useConfig();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false); // Changed default to false, load on select
    const [syncLogs, setSyncLogs] = useState([]);

    // Doctor Selection State
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(localStorage.getItem('last_selected_doctor_id') || '');

    // QR Modal State
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [qrExpiry, setQrExpiry] = useState(null);

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
            localStorage.setItem('last_selected_doctor_id', selectedDoctor);
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
        if (!await confirm("Are you sure? This will stop syncing.")) return;
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

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <>
                        <div className="card mb-8">
                            <h3>Configuración General</h3>
                            <div className="input-group-row-center gap-4 mb-4">
                                <input
                                    type="checkbox"
                                    id="opt-rentals"
                                    checked={settings.enable_office_rentals === 'true'}
                                    onChange={(e) => updateSetting('enable_office_rentals', e.target.checked)}
                                    className="w-5 h-5"
                                    disabled={user.role !== 'admin'}
                                />
                                <label htmlFor="opt-rentals" className="input-label m-0">
                                    Activar Alquiler de Consultorios
                                </label>
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="public-base-url">URL Pública de la Clínica (Cloudflare)</label>
                                <input
                                    type="url"
                                    id="public-base-url"
                                    className="input-field max-w-400"
                                    placeholder="https://mi-consultorio.trycloudflare.com"
                                    value={settings.public_base_url || ''}
                                    onChange={(e) => updateSetting('public_base_url', e.target.value)}
                                    readOnly={user.role !== 'admin'}
                                />
                                <p className="text-sm-muted mt-1">
                                    Dirección web externa del sistema que aparecerá en enlaces y códigos QR de registro/acceso.
                                </p>
                            </div>

                            <div className="input-group mt-6">
                                <label className="input-label" htmlFor="staff-base-url">URL Base Local (Staff / Oficina)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="staff-base-url"
                                        className="input-field flex-1"
                                        placeholder="http://192.168.0.x:5173"
                                        value={settings.staff_base_url || ''}
                                        onChange={(e) => updateSetting('staff_base_url', e.target.value)}
                                        readOnly={user.role !== 'admin'}
                                    />
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => {
                                            const url = settings.staff_base_url || window.location.origin;
                                            navigator.clipboard.writeText(url);
                                            showMessage(`Local Staff Link copied: ${url}`, 'success');
                                        }}
                                    >
                                        🔗 Link
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            const url = settings.staff_base_url || window.location.origin;
                                            setQrUrl(url);
                                            setQrExpiry(null);
                                            setQrModalOpen(true);
                                        }}
                                    >
                                        💻 STAFF QR
                                    </button>
                                </div>
                                <p className="text-sm-muted mt-1">
                                    Esta sección de acceso es exclusiva para el Staff (Médicos y Secretarias). Comparta este acceso local para usar el sistema dentro de la oficina. Usa la IP de esta PC.
                                    <br />
                                    <span className="text-green-600 font-bold">✨ Se actualiza solo cuando entras desde un dispositivo nuevo en la red.</span>
                                </p>
                            </div>

                            <p className="text-sm-muted mt-4">
                                Si se desactiva el Alquiler de Consultorios, la opción "Alquileres" desaparecerá del menú lateral para todo el Staff.
                            </p>
                        </div>

                        <div className="card mb-8">
                            <h3>Aplicación Móvil (Android)</h3>
                            <p className="text-sm-muted mb-4">
                                Descargue la última versión de la aplicación para gestionar la clínica desde su dispositivo Android.
                            </p>

                            <div className="flex gap-4 items-center flex-wrap">
                                <a
                                    href={`${settings.public_base_url || window.location.origin}/uploads/secretary-app.apk`}
                                    download="secretary-app.apk"
                                    className="btn btn-primary no-decoration"
                                >
                                    ⬇️ Descargar APK
                                </a>

                                <button
                                    className="btn btn-outline"
                                    onClick={() => {
                                        const url = `${settings.public_base_url || window.location.origin}/uploads/secretary-app.apk`;
                                        navigator.clipboard.writeText(url);
                                        showMessage('Enlace de descarga copiado al portapapeles', 'success');
                                    }}
                                >
                                    🔗 Copiar Enlace
                                </button>

                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        const url = `${settings.public_base_url || window.location.origin}/uploads/secretary-app.apk`;
                                        setQrUrl(url);
                                        setQrExpiry(null);
                                        setQrModalOpen(true);
                                    }}
                                >
                                    📱 Ver QR de Descarga
                                </button>
                            </div>
                            <p className="text-xs text-muted mt-2">
                                Versión actual: v1.9.3.1
                            </p>
                        </div>
                    </>
                )}

                {/* Holiday Management - Enabled for Secretary and Admin */}
                <HolidayManager />

                {(user.role === 'admin' || user.role === 'secretary') && (
                    <div className="card">
                        <h3>Configuración por Médico (Google, Horarios)</h3>
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
                                                    const summary = await prompt("Appointment Title:");
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
                                                if (!await confirm("This will import contacts from the selected Google account. Continue?")) return;
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

                                        {/* CSV Import Section */}
                                        <div className="mt-6 border-t-divider pt-4">
                                            <h4>Importar Contactos desde CSV (Google Format)</h4>
                                            <p className="text-sm-muted mb-4">
                                                Subir archivo .csv exportado de Google Contacts.
                                            </p>
                                            <div className="flex gap-4 items-center">
                                                <input
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;

                                                        if (!await confirm(`¿Importar contactos desde ${file.name}?`)) {
                                                            e.target.value = null;
                                                            return;
                                                        }

                                                        const formData = new FormData();
                                                        formData.append('file', file);

                                                        // Streaming CSV Upload
                                                        setLoading(true);
                                                        setSyncLogs([]); // Clear logs

                                                        try {
                                                            const token = localStorage.getItem('token');
                                                            const response = await fetch(`http://${window.location.hostname}:5000/api/import/csv`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': `Bearer ${token}`
                                                                },
                                                                body: formData
                                                            });

                                                            if (!response.ok) {
                                                                const errText = await response.text();
                                                                throw new Error(errText || 'Import failed');
                                                            }

                                                            const reader = response.body.getReader();
                                                            const decoder = new TextDecoder("utf-8");
                                                            let finalResult = null;

                                                            while (true) {
                                                                const { done, value } = await reader.read();
                                                                if (done) break;

                                                                const chunk = decoder.decode(value, { stream: true });
                                                                const lines = chunk.split('\n');

                                                                for (const line of lines) {
                                                                    if (!line.trim()) continue;

                                                                    if (line.startsWith('JSON_RESULT:')) {
                                                                        try {
                                                                            finalResult = JSON.parse(line.replace('JSON_RESULT:', ''));
                                                                        } catch (e) {
                                                                            console.error("Failed to parse result", e);
                                                                        }
                                                                    } else if (line.startsWith('[LOG]')) {
                                                                        // Clean string and add to logs
                                                                        setSyncLogs(prev => [...prev.slice(-99), line.replace('[LOG] ', '')]); // Keep last 100
                                                                    } else {
                                                                        // Other format
                                                                        setSyncLogs(prev => [...prev.slice(-99), line]);
                                                                    }
                                                                }
                                                            }

                                                            if (finalResult) {
                                                                alert(`Importación completada!\nCreados: ${finalResult.created}\nActualizados: ${finalResult.updated}\nSaltados: ${finalResult.skipped}\nErrores: ${finalResult.errors}`);
                                                            }

                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('Error al importar: ' + err.message);
                                                            setSyncLogs(prev => [...prev, `FATAL ERROR: ${err.message}`]);
                                                        } finally {
                                                            setLoading(false);
                                                            e.target.value = null;
                                                        }
                                                    }}
                                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>

                                            {/* Terminal Logs Window */}
                                            {syncLogs.length > 0 && (
                                                <div className="mt-4 bg-gray-900 text-green-400 p-4 rounded-md font-mono text-xs h-64 overflow-y-auto whitespace-pre-wrap">
                                                    <div className="border-b border-gray-700 pb-2 mb-2 select-none text-gray-400">
                                                        {'>'} Terminal de Importación
                                                    </div>
                                                    {syncLogs.map((log, i) => (
                                                        <div key={i} className="mb-0.5">{log}</div>
                                                    ))}
                                                    <div className="animate-pulse">_</div>
                                                </div>
                                            )}
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

                        {selectedDoctor && (
                            <div className="mt-8 border-t border-slate-200 pt-6">
                                <DoctorScheduleSettings doctorId={selectedDoctor} />
                            </div>
                        )}

                        {user.role === 'admin' && <div className="setup-instructions">
                            <h4>Instrucciones de Configuración (Solo para Soporte Técnico)</h4>
                            <p className="mb-4">
                                Si necesita conectar una nueva cuenta de Google y no funciona el botón, por favor contacte al administrador del sistema o soporte técnico.
                            </p>

                            <details>
                                <summary className="cursor-pointer text-blue-600">Ver detalles técnicos (Avanzado)</summary>
                                <ol className="ml-6 mt-2 text-slate-600">
                                    <li>Ir a <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-link">Google Cloud Console</a>.</li>
                                    <li>Crear un Proyecto.</li>
                                    <li><strong>IMPORTANTE:</strong> Habilitar las APIs:
                                        <ul className="ml-4 mt-1 mb-2">
                                            <li><a href="https://console.cloud.google.com/apis/library/people.googleapis.com" target="_blank" rel="noreferrer" className="text-blue-500">Google People API</a> (Contactos)</li>
                                            <li><a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer" className="text-blue-500">Google Calendar API</a> (Turnos)</li>
                                        </ul>
                                    </li>
                                    <li>Crear <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-link">Credenciales OAuth 2.0</a>.</li>
                                    <li>URI de redirección: <code>http://localhost:5000/api/google/callback</code></li>
                                    <li>Agregar a <code>server/.env</code>:</li>
                                    <pre className="code-block mt-2">
                                        GOOGLE_CLIENT_ID=su_id{'\n'}
                                        GOOGLE_CLIENT_SECRET=su_secreto{'\n'}
                                        GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
                                    </pre>
                                </ol>
                            </details>
                        </div>}
                    </div>
                )}
            </main >
            <QRCodeModal
                isOpen={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                url={qrUrl}
                expiresAt={qrExpiry}
            />
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
        if (!await confirm("Remove this holiday?")) return;
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

import { useState, useEffect, useRef } from 'react';

// Internal Auto-Resizing Textarea Component to avoid dependency issues without server restart
const AutoTextarea = (props) => {
    const textareaRef = useRef(null);

    const adjustHeight = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    };

    useEffect(() => {
        adjustHeight();
    }, [props.value]);

    return (
        <textarea
            {...props}
            ref={textareaRef}
            rows={3}
            onInput={adjustHeight}
            style={{ ...props.style, overflow: 'hidden', resize: 'none' }}
        />
    );
};
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';
import Sidebar from '../components/Sidebar';
import QRCodeModal from '../components/QRCodeModal';
import { useModal } from '../context/ModalContext';
import { useAuth } from '../context/AuthContext';
import GoogleSanitizer from '../components/GoogleSanitizer';

const SystemConfig = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { settings, updateSetting, refreshSettings } = useConfig();
    const [loading, setLoading] = useState(false);
    const [syncLogs, setSyncLogs] = useState([]);

    // Derived State
    const localSettings = settings || {};
    const googleUnlinked = !localSettings.google_refresh_token;

    // QR Modal State
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [qrExpiry, setQrExpiry] = useState(null);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        if (status === 'success') {
            showMessage('Cuenta de Google Conectada con Éxito', 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (status === 'error') {
            showMessage('Error al conectar con Google', 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [showMessage]);

    const insertVariable = (textareaId, variable, settingKey) => {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + variable + text.substring(end);

        // Update state and backend
        updateSetting(settingKey, newText);

        // Restore cursor position after the inserted variable (need timeout for React re-render)
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + variable.length;
            textarea.focus();
        }, 0);
    };

    const handleGoogleAuth = async () => {
        try {
            const { data } = await api.get('/google/auth-url');
            window.location.href = data.url;
        } catch (error) {
            showMessage('Error al iniciar autenticación con Google', 'error');
        }
    };

    const handleDisconnectGoogle = async () => {
        if (!await confirm('¿Estás seguro de desconectar Google Calendar? Se dejarán de sincronizar los turnos.')) return;
        try {
            await api.post('/google/disconnect');
            await refreshSettings();
            showMessage('Cuenta desconectada correctamente', 'success');
        } catch (error) {
            showMessage('Error al desconectar cuenta', 'error');
        }
    };

    const handleRefreshToken = async () => {
        // Just re-trigger auth flow for now to refresh permissions
        handleGoogleAuth();
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="w-full max-w-800 mx-auto">
                    <div className="tabs-container mb-8">
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <button
                                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                ⚙️ General
                            </button>
                        )}
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <button
                                className={`tab-btn ${activeTab === 'communications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('communications')}
                            >
                                📢 Comunicaciones
                            </button>
                        )}
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <button
                                className={`tab-btn ${activeTab === 'integrations' ? 'active' : ''}`}
                                onClick={() => setActiveTab('integrations')}
                            >
                                🔌 Integraciones
                            </button>
                        )}
                        {(user.role === 'admin' || user.role === 'secretary') && (
                            <button
                                className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                                onClick={() => setActiveTab('data')}
                            >
                                💾 Datos
                            </button>
                        )}
                    </div>

                    {/* --- TAB: GENERAL --- */}
                    {activeTab === 'general' && (user.role === 'admin' || user.role === 'secretary') && (
                        <div className="tab-panel animate-in">
                            <div className="card">
                                <h3 className="config-section-title">🛠️ Funcionalidades y Permisos</h3>
                                <div className="space-y-6">
                                    <label className="switch-container">
                                        <div className="switch">
                                            <input
                                                type="checkbox"
                                                id="opt-rentals"
                                                checked={settings.enable_office_rentals === 'true'}
                                                onChange={(e) => updateSetting('enable_office_rentals', e.target.checked)}
                                                disabled={user.role !== 'admin'}
                                            />
                                            <span className="slider"></span>
                                        </div>
                                        <span className="input-label m-0">
                                            Activar Alquiler de Consultorios
                                        </span>
                                    </label>

                                    <label className="switch-container">
                                        <div className="switch">
                                            <input
                                                type="checkbox"
                                                id="allow-secretary-edit-past"
                                                checked={settings.allow_secretary_edit_past_appointments === 'true'}
                                                onChange={(e) => updateSetting('allow_secretary_edit_past_appointments', e.target.checked)}
                                                disabled={user.role !== 'admin'}
                                            />
                                            <span className="slider"></span>
                                        </div>
                                        <span className="input-label m-0">
                                            Permitir a Secretarias editar turnos anteriores
                                        </span>
                                    </label>

                                    <label className="switch-container">
                                        <div className="switch">
                                            <input
                                                type="checkbox"
                                                id="enable-secretary-unrestricted-crud"
                                                checked={settings.enable_secretary_unrestricted_crud === 'true'}
                                                onChange={(e) => updateSetting('enable_secretary_unrestricted_crud', e.target.checked)}
                                                disabled={user.role !== 'admin'}
                                            />
                                            <span className="slider"></span>
                                        </div>
                                        <span className="input-label m-0">
                                            Habilitar Gestión Global (CRUD) de turnos en cualquier estado para Secretarias
                                        </span>
                                    </label>

                                    <label className="switch-container">
                                        <div className="switch">
                                            <input
                                                type="checkbox"
                                                id="enable-secretary-finance-crud"
                                                checked={settings.enable_secretary_finance_crud === 'true'}
                                                onChange={(e) => updateSetting('enable_secretary_finance_crud', e.target.checked)}
                                                disabled={user.role !== 'admin'}
                                            />
                                            <span className="slider"></span>
                                        </div>
                                        <span className="input-label m-0">
                                            Permitir a Secretarias corregir montos y eliminar transacciones (CRUD Finanzas)
                                        </span>
                                    </label>

                                    <label className="switch-container">
                                        <div className="switch">
                                            <input
                                                type="checkbox"
                                                id="allow-admin-edit-finance-date"
                                                checked={settings.allow_admin_edit_finance_date === 'true'}
                                                onChange={(e) => updateSetting('allow_admin_edit_finance_date', e.target.checked)}
                                                disabled={user.role !== 'admin'}
                                            />
                                            <span className="slider"></span>
                                        </div>
                                        <span className="input-label m-0">
                                            [ADMIN] Permitir editar FECHA de pago en Finanzas
                                        </span>
                                    </label>
                                </div>

                                <div className="section-divider my-8" style={{ height: '1px', background: '#e2e8f0' }}></div>

                                <h3 className="config-section-title">🔗 Direcciones del Sistema</h3>
                                <div className="grid-2-cols gap-8">
                                    <div className="input-group">
                                        <label className="input-label" htmlFor="public-base-url">URL Pública (Internet)</label>
                                        <input
                                            type="url"
                                            id="public-base-url"
                                            className="input-field"
                                            placeholder="https://mi-consultorio.trycloudflare.com"
                                            value={settings.public_base_url || ''}
                                            onChange={(e) => updateSetting('public_base_url', e.target.value)}
                                            readOnly={user.role !== 'admin'}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label" htmlFor="staff-base-url">URL Local (Red Clínica)</label>
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
                                                className="btn btn-secondary shadow-sm hover:bg-slate-700 transition-colors"
                                                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                onClick={() => {
                                                    const url = settings.staff_base_url || window.location.origin;
                                                    setQrUrl(url);
                                                    setQrExpiry(null);
                                                    setQrModalOpen(true);
                                                }}
                                                title="Ver QR Staff"
                                            >
                                                <span>📱</span> <span>QR</span>
                                            </button>
                                        </div>
                                        <p className="text-sm text-muted mt-2">
                                            Para conectar dispositivos locales.
                                        </p>
                                    </div>
                                </div>

                            </div>
                            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                <span className="text-xl">💡</span>
                                <p className="text-sm text-blue-700">
                                    <strong>Nota:</strong> La herramienta de <strong>Programación Masiva de Agenda</strong> se ha movido a la pestaña de "Horarios" dentro de la ficha de cada Médico para un control más preciso.
                                </p>
                            </div>
                        </div>
                    )}



                    {/* --- TAB: COMMUNICATIONS --- */}
                    {activeTab === 'communications' && (user.role === 'admin' || user.role === 'secretary') && (
                        <div className="tab-panel animate-in">
                            <div className="card mb-8">
                                <h3 className="config-section-title">💬 Mensajería y Plantillas</h3>
                                <p className="text-muted mb-6">Personalice los mensajes que se envían por WhatsApp.</p>

                                <div className="flex flex-col gap-8">
                                    {/* Appt Reminder */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">📅</span>
                                            <h4 className="font-bold text-main-800">Recordatorio de Turno</h4>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="reminder-template">Plantilla de Mensaje</label>
                                            <AutoTextarea
                                                id="reminder-template"
                                                className="input-field min-h-[120px]"
                                                placeholder="Hola {patient_name}, te escribimos para confirmar tu turno del día {date} a las {time} con el/la Dr/a. {doctor_name}. Por favor confirma asistencia."
                                                value={settings.appointment_reminder_template || ''}
                                                onChange={(e) => updateSetting('appointment_reminder_template', e.target.value)}
                                                disabled={user.role !== 'admin' && user.role !== 'secretary'}
                                            />

                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {['{patient_name}', '{date}', '{time}', '{doctor_name}', '{secretary_name}'].map(v => (
                                                    <span
                                                        key={v}
                                                        className="badge badge-blue cursor-pointer hover:bg-blue-200 transition-colors"
                                                        onClick={() => insertVariable('reminder-template', v, 'appointment_reminder_template')}
                                                        title="Clic para insertar"
                                                    >
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edit Link */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">🔗</span>
                                            <h4 className="font-bold text-main-800">Enlace de Edición de Perfil (QR/Link)</h4>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="edit-link-template">Plantilla de Mensaje</label>
                                            <AutoTextarea
                                                id="edit-link-template"
                                                className="input-field min-h-[120px]"
                                                placeholder="Hola {name}, por favor actualiza tus datos en el siguiente enlace: {link}"
                                                value={settings.temp_access_message_template || ''}
                                                onChange={(e) => updateSetting('temp_access_message_template', e.target.value)}
                                                disabled={user.role !== 'admin' && user.role !== 'secretary'}
                                            />

                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {['{name}', '{link}', '{doctor_name}', '{secretary_name}'].map(v => (
                                                    <span
                                                        key={v}
                                                        className="badge badge-purple cursor-pointer hover:bg-purple-200 transition-colors"
                                                        onClick={() => insertVariable('edit-link-template', v, 'temp_access_message_template')}
                                                        title="Clic para insertar"
                                                    >
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted mt-1 italic">
                                                Este mensaje se usa al compartir el link o QR para que el paciente edite sus datos.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Next Free Slot - NEW */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">🕒</span>
                                            <h4 className="font-bold text-main-800">Próximo Turno Disponible</h4>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="next-free-template">Plantilla de Mensaje</label>
                                            <AutoTextarea
                                                id="next-free-template"
                                                className="input-field min-h-[120px]"
                                                placeholder="El próximo turno disponible para {doctor_name} es el {date} a las {time}."
                                                value={settings.next_free_slot_template || ''}
                                                onChange={(e) => updateSetting('next_free_slot_template', e.target.value)}
                                                disabled={user.role !== 'admin' && user.role !== 'secretary'}
                                            />

                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {['{doctor_name}', '{date}', '{time}', '{secretary_name}'].map(v => (
                                                    <span
                                                        key={v}
                                                        className="badge badge-indigo cursor-pointer hover:bg-indigo-200 transition-colors"
                                                        onClick={() => insertVariable('next-free-template', v, 'next_free_slot_template')}
                                                        title="Clic para insertar"
                                                    >
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: INTEGRATIONS --- */}
                    {activeTab === 'integrations' && (user.role === 'admin' || user.role === 'secretary') && (
                        <div className="tab-panel animate-in">
                            {/* GOOGLE INTEGRATION */}
                            <div className="card mb-8">
                                <h2 className="text-xl font-bold text-main-800 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">📅</span> Integración con Google Calendar
                                </h2>

                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-main-600 mb-2">
                                                Conecta tu cuenta de Google para sincronizar turnos automáticamente.
                                            </p>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className={`w-3 h-3 rounded-full ${googleUnlinked ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}></div>
                                                <span className="font-medium text-main-700">
                                                    Estado: {googleUnlinked ? 'Desconectado' : 'Conectado'}
                                                </span>
                                            </div>
                                        </div>

                                        {!googleUnlinked && (
                                            <div className="flex flex-col items-end gap-2">
                                                <label className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                                                    <span className="text-sm font-semibold text-main-700">
                                                        {localSettings.google_sync_enabled === 'false' ? '⏸️ Sincronización PAUSADA' : '✅ Sincronización ACTIVA'}
                                                    </span>
                                                    <div className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={localSettings.google_sync_enabled !== 'false'}
                                                            onChange={(e) => updateSetting('google_sync_enabled', e.target.checked ? 'true' : 'false')}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </div>
                                                </label>
                                                <p className="text-xs text-muted text-right">
                                                    Si pausas, los cambios en la App no se enviarán a Google, pero la cuenta sigue conectada.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {!googleUnlinked ? (
                                        <div className="flex flex-wrap gap-4">
                                            <button
                                                onClick={handleRefreshToken}
                                                className="btn btn-secondary flex items-center gap-2"
                                            >
                                                🔄 Refrescar Enlace
                                            </button>
                                            <button
                                                onClick={handleDisconnectGoogle}
                                                className="btn bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-2"
                                            >
                                                ❌ Desconectar Cuenta
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleGoogleAuth}
                                            className="btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-xl transition-all hover:-translate-y-0.5"
                                        >
                                            <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" alt="Google Calendar" className="w-6 h-6" />
                                            Conectar Google Calendar
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="card mb-8">
                                <h3 className="config-section-title">🌐 Conectividad Web (Cloudflare)</h3>
                                <p className="text-muted mb-6">Administre el túnel que permite el acceso remoto seguro a la clínica.</p>

                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-6">
                                    <div className="flex flex-col flex-1 min-w-[280px]">
                                        <span className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Estado del Túnel</span>
                                        <div className="flex flex-col gap-2">
                                            <div className="chip-green status-chip w-fit">Túnel Activo</div>
                                            <span className="text-sm font-mono text-main-600 break-all bg-white/50 p-2 rounded border border-slate-100">{settings.public_base_url || 'No detectada'}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary shadow-lg hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-2"
                                        style={{ height: 'fit-content' }}
                                        onClick={async () => {
                                            if (!await confirm("¿Solicitar nuevo enlace a Cloudflare? Esto reiniciará el túnel y tardará unos segundos.")) return;
                                            const oldUrl = settings.public_base_url;
                                            try {
                                                setLoading(true);
                                                await api.post('/settings/refresh-tunnel');
                                                showMessage('Solicitando nuevo enlace... por favor espere.', 'info');
                                                let attempts = 0;
                                                const interval = setInterval(async () => {
                                                    attempts++;
                                                    await refreshSettings();
                                                    const res = await api.get('/settings');
                                                    if (res.data.public_base_url !== oldUrl) {
                                                        clearInterval(interval);
                                                        setLoading(false);
                                                        showMessage('¡Enlace actualizado con éxito!', 'success');
                                                    }
                                                    if (attempts > 15) {
                                                        clearInterval(interval);
                                                        setLoading(false);
                                                        showMessage('El enlace está tardando en actualizarse.', 'warning');
                                                    }
                                                }, 3000);
                                            } catch (err) {
                                                showMessage('Error al refrescar túnel', 'error');
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? '⏳ Actualizando...' : '🔄 Refrescar Enlace Externo'}
                                    </button>
                                </div>
                            </div>

                            {/* --- GOOGLE SANITIZER TOOL --- */}
                            <div className="mb-8">
                                <GoogleSanitizer />
                            </div>

                            <div className="card">
                                <h3 className="config-section-title">📱 Aplicación Móvil (APK)</h3>
                                <p className="text-muted mb-6">
                                    Descargue y distribuya la aplicación oficial para gestionar la clínica desde dispositivos Android.
                                </p>

                                <div className="grid-2-cols gap-6 mb-8">
                                    <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                                        <h4 className="font-bold mb-2">Descarga Remota</h4>
                                        <p className="text-sm text-main-600 mb-4">Para uso fuera de la clínica (requiere internet).</p>
                                        <div className="flex gap-2">
                                            <a
                                                href={`${settings.public_base_url || window.location.origin}/uploads/secretary-app.apk`}
                                                download="secretary-app.apk"
                                                className="btn btn-primary btn-sm flex-1 no-decoration text-center shadow-sm hover:scale-[1.02] transition-transform"
                                            >
                                                📥 Descargar APK
                                            </a>
                                            <button
                                                className="btn btn-secondary btn-sm shadow-sm hover:scale-105 transition-transform"
                                                onClick={() => {
                                                    const url = `${settings.public_base_url || window.location.origin}/uploads/secretary-app.apk`;
                                                    setQrUrl(url); setQrExpiry(null); setQrModalOpen(true);
                                                }}
                                            >
                                                📱 QR
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                        <h4 className="font-bold mb-2">Descarga Local</h4>
                                        <p className="text-sm text-main-600 mb-4">Ideal para tablets dentro de la clínica (más rápido).</p>
                                        <div className="flex gap-2">
                                            <a
                                                href={`${settings.staff_base_url || window.location.origin}/uploads/secretary-app.apk`}
                                                download="secretary-app.apk"
                                                className="btn btn-outline-secondary btn-sm flex-1 no-decoration text-center shadow-sm hover:scale-[1.02] transition-transform"
                                            >
                                                🏠 Descargar Local
                                            </a>
                                            <button
                                                className="btn btn-secondary btn-sm shadow-sm hover:scale-105 transition-transform"
                                                onClick={() => {
                                                    const url = `${settings.staff_base_url || window.location.origin}/uploads/secretary-app.apk`;
                                                    setQrUrl(url); setQrExpiry(null); setQrModalOpen(true);
                                                }}
                                            >
                                                📱 QR
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-muted">
                                    <span>Clínica Flow Mobile Core</span>
                                    <span className="chip-blue">v1.9.3.1</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: DATA --- */}
                    {activeTab === 'data' && (user.role === 'admin' || user.role === 'secretary') && (
                        <div className="tab-panel animate-in">
                            <div className="card mb-8">
                                <h3 className="config-section-title">💾 Operaciones de Datos</h3>
                                <p className="text-muted mb-6">Herramientas de importación y mantenimiento.</p>

                                <div className="space-y-8">
                                    <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📁</div>
                                            <div>
                                                <h4 className="font-bold text-main-800 text-lg">Importar Pacientes (CSV Contacts)</h4>
                                                <p className="text-sm text-main-500">Carga masiva desde Google Contacts o archivos CSV compatibles.</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-sm text-main-600 mb-4 px-4">Seleccione su archivo <strong>.csv</strong> para iniciar el proceso de sincronización.</p>
                                                <input
                                                    type="file"
                                                    id="csv-upload"
                                                    accept=".csv"
                                                    style={{ display: 'none' }}
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        if (!await confirm(`¿Importar contactos desde ${file.name}?`)) {
                                                            e.target.value = null;
                                                            return;
                                                        }
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        setLoading(true);
                                                        setSyncLogs([]);
                                                        try {
                                                            const token = localStorage.getItem('token');
                                                            const response = await fetch(`http://${window.location.hostname}:5000/api/import/csv`, {
                                                                method: 'POST',
                                                                headers: { 'Authorization': `Bearer ${token}` },
                                                                body: formData
                                                            });
                                                            if (!response.ok) throw new Error('Falló la importación');
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
                                                                        finalResult = JSON.parse(line.replace('JSON_RESULT:', ''));
                                                                    } else if (line.startsWith('[LOG]')) {
                                                                        setSyncLogs(prev => [...prev.slice(-99), line.replace('[LOG] ', '')]);
                                                                    }
                                                                }
                                                            }
                                                            if (finalResult) showMessage(`¡Importación Completa!\nNuevos: ${finalResult.created} | Actualizados: ${finalResult.updated}`, 'success');
                                                        } catch (err) {
                                                            showMessage('Error: ' + err.message, 'error');
                                                        } finally {
                                                            setLoading(false);
                                                            e.target.value = null;
                                                        }
                                                    }}
                                                />
                                                <label htmlFor="csv-upload" className="btn btn-primary shadow-md hover:scale-105 transition-transform cursor-pointer inline-flex items-center gap-2">
                                                    {loading ? '⏳ Procesando...' : '📄 Seleccionar Archivo'}
                                                </label>
                                            </div>
                                        </div>

                                        {syncLogs.length > 0 && (
                                            <div className="mt-8">
                                                <div className="flex items-center justify-between mb-2 px-1">
                                                    <span className="text-xs font-bold text-muted uppercase tracking-widest">Logs de Sincronización</span>
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
                                                </div>
                                                <div className="bg-slate-900 text-emerald-400 p-5 rounded-xl font-mono text-xs h-64 overflow-y-auto whitespace-pre-wrap shadow-2xl border border-slate-800 custom-scrollbar">
                                                    {syncLogs.map((log, i) => (
                                                        <div key={i} className="mb-1 opacity-90 border-l-2 border-emerald-900/50 pl-3 hover:bg-emerald-400/5 transition-colors">
                                                            <span className="text-emerald-800 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                                            {log}
                                                        </div>
                                                    ))}
                                                    <div className="animate-pulse text-emerald-500 font-bold">_</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {user.role === 'admin' && (
                                    <details className="p-4 border border-amber-100 bg-amber-50/50 rounded-lg">
                                        <summary className="font-bold text-amber-800 cursor-pointer">⚠️ Detalles Técnicos (Avanzado)</summary>
                                        <div className="mt-4 text-sm text-amber-900 space-y-2">
                                            <p>Para soporte técnico: las credenciales de Google se configuran mediante el archivo <code>.env</code> del servidor.</p>
                                            <p>Callback URL: <code>http://localhost:5000/api/google/callback</code></p>
                                        </div>
                                    </details>
                                )}
                            </div>
                        </div>
                    )}
                </div>
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

export default SystemConfig;

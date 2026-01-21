import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';

import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { formatPrice } from '../utils/format';
import CurrencyInput from '../components/CurrencyInput';
import DoctorScheduleSettings from '../components/DoctorScheduleSettings';

const Doctors = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { alert } = useModal();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [settings, setSettings] = useState({});

    // Edit State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});
    const [activeTab, setActiveTab] = useState('tariffs'); // 'tariffs', 'google', 'schedule'
    const [connected, setConnected] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);


    // Schedule State
    const [schedule, setSchedule] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [saving, setSaving] = useState(false);
    const fetchDoctors = async () => {
        try {
            const [docsRes, settingsRes] = await Promise.all([
                api.get('/users/doctors'),
                api.get('/settings')
            ]);
            setDoctors(docsRes.data);
            setSettings(settingsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();

        // Check for Google Auth redirect status
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        if (status === 'success') {
            showMessage('Cuenta de Google conectada con éxito', 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (status === 'error') {
            showMessage('Error al conectar con Google', 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const checkGoogleStatus = async (doctorId) => {
        setLoadingGoogle(true);
        try {
            const res = await api.get(`/google/status?doctorId=${doctorId}`);
            setConnected(res.data.connected);
        } catch (err) {
            console.error(err);
            setConnected(false);
        } finally {
            setLoadingGoogle(false);
        }
    };

    const handleConnectGoogle = async () => {
        if (!editData.id) return;
        try {
            const res = await api.get(`/google/auth-url?doctorId=${editData.id}`);
            window.location.href = res.data.url;
        } catch (err) {
            showMessage('Failed to initiate connection.', 'error');
            console.error(err);
        }
    };

    const handleDisconnectGoogle = async () => {
        if (!await confirm("¿Estás seguro? Se detendrá la sincronización.")) return;
        try {
            await api.post('/google/disconnect', { doctorId: editData.id });
            setConnected(false);
            showMessage('Desconectado', 'success');
        } catch (err) {
            console.error(err);
        }
    };

    const normalizeText = (text) => {
        if (!text) return "";
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredDoctors = doctors.filter(d =>
        normalizeText(d.full_name).includes(normalizeText(searchTerm)) ||
        (d.specialty && normalizeText(d.specialty).includes(normalizeText(searchTerm))) ||
        (d.phone && d.phone.includes(searchTerm))
    );

    const handleEditClick = (doc) => {
        setEditData({
            id: doc.id,
            specialty: doc.specialty || '',
            cbu: doc.cbu || '',
            office_number: doc.office_number || '',
            rental_type: doc.rental_type || 'monthly',
            rental_cost: doc.rental_cost || 0,
            consultation_price: doc.consultation_price || 0,
            prescription_price: doc.prescription_price || 0,
            medical_license_price: doc.medical_license_price || 0,
            certificate_price: doc.certificate_price || 0,
            virtual_consultation_price: doc.virtual_consultation_price || 0,
            appointment_duration: doc.appointment_duration || 60,
            break_duration: doc.break_duration || 0,
            default_visit_interval_days: doc.default_visit_interval_days || 0,
            default_prescription_interval_days: doc.default_prescription_interval_days || 0
        });
        setActiveTab('tariffs');

        checkGoogleStatus(doc.id);
        fetchSchedule(doc.id);
        setEditModalOpen(true);
    };

    const fetchSchedule = async (doctorId) => {
        setLoadingSchedule(true);
        try {
            const res = await api.get(`/schedules/${doctorId}`);
            setSchedule(res.data);
        } catch (err) {
            console.error("Failed to load schedule", err);
            setSchedule([]);
        } finally {
            setLoadingSchedule(false);
        }
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await Promise.all([
                api.put(`/users/doctors/${editData.id}`, editData),
                api.put(`/schedules/${editData.id}`, { schedule })
            ]);

            showMessage(t('doctor_updated') || "Doctor actualizado exitosamente", "success");
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to show message
            setEditModalOpen(false);
            fetchDoctors();
        } catch (err) {
            console.error("Failed to update doctor", err);
            const errorMsg = err.response?.data?.message || err.response?.data || err.message || "Error al actualizar doctor";
            showMessage(errorMsg, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>{t('loading')}</div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="flex-between-center">
                    <h1 className="title">{t('doctors_title')}</h1>
                </div>

                {/* Search Bar */}
                <div className="search-bar-container mb-6">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={t('search_doctors_placeholder')}
                            className="search-bar-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="item-grid">
                    {filteredDoctors.length === 0 ? <p className="text-muted col-span-full text-center py-8">{t('no_doctors_found')}</p> : filteredDoctors.map(d => (
                        <div key={d.id} className="item-card group">
                            <div className="item-header">
                                <div className="doctor-avatar">
                                    {d.full_name ? d.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-main-800 m-0 leading-tight">{d.full_name}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--blue-600)', margin: '0.25rem 0 0 0', fontWeight: '500' }}>{d.specialty || 'General'}</p>
                                </div>
                            </div>

                            <div className="item-content">
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                    <div className="flex items-center gap-2">
                                        <span>📞</span> <span className="font-medium">
                                            {d.phone ? <a href={`tel:${d.phone.replace(/[^0-9]/g, '')}`} style={{ color: 'var(--text-secondary)' }}>{d.phone}</a> : 'No phone'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>🏢</span> <span>{t('office_label')}: <span className="font-medium">
                                            {d.office_number ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Consultorio ' + d.office_number + ' Tandil')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)' }}>{d.office_number}</a> : 'N/A'}
                                        </span></span>
                                    </div>
                                </div>

                                <div className="doctor-info-grid">
                                    <div className="doctor-price-item">
                                        <span className="doctor-price-label">{t('consult_abbrev')}</span>
                                        <span className="doctor-price-value">{formatPrice(d.consultation_price)}</span>
                                    </div>
                                    <div className="doctor-price-item">
                                        <span className="doctor-price-label">{t('rx_abbrev')}</span>
                                        <span className="doctor-price-value">{formatPrice(d.prescription_price)}</span>
                                    </div>
                                    <div className="doctor-price-item">
                                        <span className="doctor-price-label">{t('lic_abbrev')}</span>
                                        <span className="doctor-price-value">{formatPrice(d.medical_license_price)}</span>
                                    </div>
                                    <div className="doctor-price-item">
                                        <span className="doctor-price-label">{t('cert_abbrev') || 'Cert.'}</span>
                                        <span className="doctor-price-value">{formatPrice(d.certificate_price)}</span>
                                    </div>
                                </div>
                            </div>

                            {(user.role === 'secretary' || user.role === 'admin' || user.id === d.user_id || user.user_id === d.user_id) && (
                                <div className="item-footer">
                                    <button className="btn btn-secondary btn-sm-compact" onClick={() => handleEditClick(d)}>
                                        {t('edit_details')} / Configurar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <Modal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    title={t('edit_doctor_details')}
                    size="lg"
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
                                {t('cancel') || 'Cancel'}
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? '⌛ Guardando...' : (t('save_changes') || 'Save')}
                            </button>
                        </>
                    }
                >
                    <div className="tabs-container mb-6" style={{ borderBottom: '1px solid #eee' }}>
                        <button
                            className={`tab-btn-small ${activeTab === 'tariffs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tariffs')}
                        >
                            💰 Tarifas y Oficina
                        </button>
                        <button
                            className={`tab-btn-small ${activeTab === 'schedule' ? 'active' : ''}`}
                            onClick={() => setActiveTab('schedule')}
                        >
                            📅 Horarios
                        </button>
                        <button
                            className={`tab-btn-small ${activeTab === 'google' ? 'active' : ''}`}
                            onClick={() => setActiveTab('google')}
                        >
                            🌐 Google Sync
                        </button>
                    </div>

                    <div className="tab-content-wrapper">
                        {activeTab === 'tariffs' && (
                            <div key="tariffs" className="animate-in flex-col gap-4">
                                {(settings.enable_office_rentals === 'true') && (
                                    <>
                                        <h4 className="section-header-line">{t('rental_section')}</h4>
                                        <div className="input-group">
                                            <label className="input-label">{t('office_number')}</label>
                                            <input className="input-field" value={editData.office_number} onChange={e => setEditData({ ...editData, office_number: e.target.value })} />
                                        </div>

                                        <div className="grid-2-cols mb-6">
                                            <div className="input-group">
                                                <label className="input-label">{t('rental_type')}</label>
                                                <select className="input-field" value={editData.rental_type} onChange={e => setEditData({ ...editData, rental_type: e.target.value })}>
                                                    <option value="hourly">{t('hourly')}</option>
                                                    <option value="daily">{t('daily')}</option>
                                                    <option value="weekly">{t('weekly')}</option>
                                                    <option value="monthly">{t('monthly')}</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">{t('rent_cost')}</label>
                                                <CurrencyInput className="input-field" value={editData.rental_cost} onChange={e => setEditData({ ...editData, rental_cost: e.target.value })} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex-between-center">
                                    <h4 className="section-header-line m-0">{t('tariffs_section')}</h4>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duración: {editData.appointment_duration}m + {editData.break_duration}m</div>
                                </div>
                                <div className="grid-2-cols">
                                    <div className="input-group">
                                        <label className="input-label">{t('consultation_price')}</label>
                                        <CurrencyInput className="input-field" value={editData.consultation_price} onChange={e => setEditData({ ...editData, consultation_price: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('virtual_consultation_price')}</label>
                                        <CurrencyInput className="input-field" value={editData.virtual_consultation_price} onChange={e => setEditData({ ...editData, virtual_consultation_price: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('prescription_price')}</label>
                                        <CurrencyInput className="input-field" value={editData.prescription_price} onChange={e => setEditData({ ...editData, prescription_price: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('medical_license_price')}</label>
                                        <CurrencyInput className="input-field" value={editData.medical_license_price} onChange={e => setEditData({ ...editData, medical_license_price: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('certificate_price') || 'Certificate Price'}</label>
                                        <CurrencyInput className="input-field" value={editData.certificate_price} onChange={e => setEditData({ ...editData, certificate_price: e.target.value })} />
                                    </div>
                                </div>

                                <h4 className="section-header-line">{t('professional_details') || 'Detalles Profesionales'}</h4>
                                <div className="grid-2-cols">
                                    <div className="input-group">
                                        <label className="input-label">{t('specialty') || 'Especialidad'}</label>
                                        <input type="text" className="input-field" value={editData.specialty} onChange={e => setEditData({ ...editData, specialty: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('cbu_alias') || 'CBU/Alias'}</label>
                                        <input type="text" className="input-field" value={editData.cbu} onChange={e => setEditData({ ...editData, cbu: e.target.value })} />
                                    </div>
                                </div>

                                <h4 className="section-header-line">{t('follow_up_settings') || 'Configuración de Seguimiento'}</h4>
                                <div className="grid-2-cols">
                                    <div className="input-group">
                                        <label className="input-label">{t('visit_interval_days') || 'Intervalo entre Visitas (Días)'}</label>
                                        <input type="number" className="input-field" value={editData.default_visit_interval_days} onChange={e => setEditData({ ...editData, default_visit_interval_days: e.target.value })} min="0" />
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{t('profile_follow_up_help') || 'Tiempo predeterminado entre chequeos.'}</p>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('prescription_interval_days') || 'Intervalo para Recetas (Días)'}</label>
                                        <input type="number" className="input-field" value={editData.default_prescription_interval_days} onChange={e => setEditData({ ...editData, default_prescription_interval_days: e.target.value })} min="0" />
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{t('profile_prescription_help') || 'Duración predeterminada para recetas crónicas.'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'schedule' && (
                            <div key="schedule" className="animate-in space-y-6">
                                <h4 className="section-header-line">Configuración de Agenda</h4>
                                <div className="grid-2-cols mb-6">
                                    <div className="input-group">
                                        <label className="input-label">{t('appointment_duration') || 'Duración Turno (min)'}</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={editData.appointment_duration}
                                            onChange={e => setEditData({ ...editData, appointment_duration: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('break_duration') || 'Tiempo Descanso (min)'}</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={editData.break_duration}
                                            onChange={e => setEditData({ ...editData, break_duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DoctorScheduleSettings
                                    doctorId={editData.id}
                                    schedule={schedule}
                                    setSchedule={setSchedule}
                                    loading={loadingSchedule}
                                />
                            </div>
                        )}

                        {activeTab === 'google' && (
                            <div key="google" className="animate-in space-y-6">
                                <h4 className="section-header-line">Integración con Google</h4>
                                <div style={{ padding: '1.5rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)' }}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 style={{ fontWeight: '700', fontSize: '1.125rem', marginBottom: '0.25rem' }}>Estado de Sincronización</h4>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sincroniza Turnos con Calendar y Pacientes con Contactos.</p>
                                        </div>
                                        {loadingGoogle ? (
                                            <div className="animate-spin text-accent-color">⌛</div>
                                        ) : (
                                            <div className={`chip-${connected ? 'green' : 'gray'} status-chip`}>
                                                {connected ? '● Conectado' : '○ Desconectado'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 mb-4">
                                        {connected ? (
                                            <button className="btn btn-outline-danger" onClick={handleDisconnectGoogle}>❌ Desconectar Cuenta</button>
                                        ) : (
                                            <button className="btn btn-primary" onClick={handleConnectGoogle}>🔗 Conectar con Google</button>
                                        )}
                                    </div>

                                    {connected && (
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                                            <button className="btn btn-secondary" onClick={async () => {
                                                try {
                                                    const res = await api.get(`/google/appointments?doctorId=${editData.id}`);
                                                    showMessage(`Se encontraron ${res.data.events?.length || 0} eventos futuros en el calendario.`, 'success');
                                                } catch (err) {
                                                    showMessage('Error: ' + (err.response?.data?.error || err.message), 'error');
                                                }
                                            }}>
                                                📅 Verificar Calendario
                                            </button>

                                            <button className="btn btn-accent" onClick={async () => {
                                                if (!await confirm("¿Importar contactos de Google a la base de pacientes local?")) return;
                                                setLoadingGoogle(true);
                                                try {
                                                    const res = await api.post('/google/import', { doctorId: editData.id });
                                                    showMessage(`Importación Completa!\nCreados: ${res.data.results.created}\nActualizados: ${res.data.results.updated}`, 'success');
                                                } catch (err) {
                                                    showMessage('Error: ' + (err.response?.data?.error || err.message), 'error');
                                                } finally {
                                                    setLoadingGoogle(false);
                                                }
                                            }}>
                                                📥 Sincronizar Contactos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            </main>
        </div>
    );
};

export default Doctors;

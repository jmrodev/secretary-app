import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { formatPrice } from '../utils/format';
import CurrencyInput from '../components/CurrencyInput';

const Doctors = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [settings, setSettings] = useState({});

    // Edit State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});

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
    }, []);

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
            office_number: doc.office_number || '',
            rental_type: doc.rental_type || 'monthly',
            rental_cost: doc.rental_cost || 0,
            consultation_price: doc.consultation_price || 0,
            prescription_price: doc.prescription_price || 0,
            medical_license_price: doc.medical_license_price || 0,
            virtual_consultation_price: doc.virtual_consultation_price || 0
        });
        setEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            await api.put(`/users/doctors/${editData.id}`, editData);
            setEditModalOpen(false);
            fetchDoctors();
        } catch (err) {
            console.error("Failed to update doctor", err);
            alert("Failed to update doctor.");
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
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder={t('search_doctors_placeholder')}
                        className="input-field max-w-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="item-grid">
                    {filteredDoctors.length === 0 ? <p className="text-muted col-span-full text-center py-8">{t('no_doctors_found')}</p> : filteredDoctors.map(d => (
                        <div key={d.id} className="item-card group">
                            <div className="item-header">
                                <div className="doctor-avatar">
                                    {d.full_name ? d.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 m-0 leading-tight">{d.full_name}</h3>
                                    <p className="text-sm text-blue-600 m-0 mt-1 font-medium">{d.specialty || 'General'}</p>
                                </div>
                            </div>

                            <div className="item-content">
                                <div className="text-sm text-slate-600 flex flex-col gap-1 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span>📞</span> <span className="font-medium">{d.phone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>🏢</span> <span>{t('office_label')}: <span className="font-medium">{d.office_number || 'N/A'}</span></span>
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

                            {user.role === 'secretary' && (
                                <div className="item-footer">
                                    <button className="btn btn-secondary btn-sm-compact" onClick={() => handleEditClick(d)}>
                                        {t('edit_details')}
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
                            <button className="btn btn-primary" onClick={handleSaveEdit}>
                                {t('save_changes') || 'Save'}
                            </button>
                        </>
                    }
                >
                    <div className="flex-col gap-4">
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

                        <h4 className="section-header-line">{t('tariffs_section')}</h4>
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
                    </div>
                </Modal>
            </main>
        </div>
    );
};

export default Doctors;

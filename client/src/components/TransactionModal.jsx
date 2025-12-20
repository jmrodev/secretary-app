
import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';

const TransactionModal = ({ isOpen, onClose, onSuccess, initialData = null, requestId }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        type: 'income_patient',
        amount: '',
        description: '',
        related_user_id: '',
        doctor_id: '',
        method: 'cash',
        status: 'paid',
        service_type: 'consultation',
        proof: null
    });

    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [pricingInfo, setPricingInfo] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    // Autocomplete state
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const data = initialData || {};
            setFormData(prev => ({
                ...prev,
                type: data.type || 'income_patient',
                amount: data.amount || '',
                description: data.description || '',
                related_user_id: data.patientUserId || data.patientId || '', // prefer userId, fallback (though likely wrong if fallback is patientId)
                doctor_id: data.doctorId || '',
                method: data.method || 'cash',
                status: data.status || 'paid'
            }));

            // Auto-fetch pricing if doctor and patient are present
            if (data.doctorId && data.patientId) {
                fetchPricing(data.doctorId, data.patientId);
            }

            // Pre-fill search if patient is set
            if (data.patientName) {
                setPatientSearch(`${data.patientName} (${data.patientDni || 'N/A'})`);
            } else {
                setPatientSearch('');
            }

            fetchLists();
        }
    }, [isOpen]); // Dependent only on isOpen to avoid loops with unstable initialData objects

    const fetchPricing = async (docId, patId, serviceType = 'consultation') => {
        try {
            const res = await api.get(`/finances/pricing?doctor_id=${docId}&patient_id=${patId}&service_type=${serviceType}`);
            if (res.data) {
                setFormData(prev => ({ ...prev, amount: res.data.price }));
                setTotalPrice(Number(res.data.price));
                setPricingInfo(res.data.explanation);
            }
        } catch (err) {
            console.error("Failed to fetch pricing", err);
        }
    };

    const fetchLists = async () => {
        try {
            const [pRes, dRes] = await Promise.all([
                api.get('/users/patients'),
                api.get('/users/doctors')
            ]);
            setPatients(pRes.data);
            setDoctors(dRes.data);
        } catch (err) {
            console.error("Failed to fetch lists", err);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) data.append(key, formData[key]);
            });

            // Calculate Debt if patient income
            if (formData.type === 'income_patient' && totalPrice > 0) {
                const paid = Number(formData.amount);
                const debt = totalPrice - paid;
                if (debt > 0) {
                    data.append('debt_amount', debt);
                }
            }

            if (requestId) {
                data.append('request_id', requestId);
            }

            const res = await api.post('/finances/transactions', data);

            if (onSuccess) onSuccess(res.data);
            onClose();
        } catch (err) {
            alert(t('failed_record_transaction'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('record_payment')}
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? t('processing') : t('confirm_payment')}
                    </button>
                </>
            }
        >
            <div className="input-group">
                <label className="input-label">{t('type')}</label>
                <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="income_patient">{t('income_patient')}</option>
                    <option value="income_rental">{t('income_rental')}</option>
                    <option value="expense_general">{t('expense_general')}</option>
                </select>
            </div>

            {formData.type === 'income_patient' && (
                <div className="input-group">
                    <label className="input-label">{t('patient')}</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder={t('search_name_dni')}
                            value={patientSearch}
                            onChange={(e) => {
                                setPatientSearch(e.target.value);
                                setShowPatientList(true);
                                setFormData({ ...formData, related_user_id: '' }); // Reset selection on edit
                            }}
                            onFocus={() => {
                                if (!initialData?.patientId) setShowPatientList(true);
                            }}
                            readOnly={!!initialData?.patientId}
                            style={initialData?.patientId ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                        />
                        {showPatientList && patientSearch && !formData.related_user_id && (
                            <ul style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                zIndex: 1000,
                                padding: 0,
                                margin: 0,
                                listStyle: 'none',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                {patients.filter(p =>
                                    p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                    (p.dni && p.dni.includes(patientSearch))
                                ).map(p => (
                                    <li
                                        key={p.id}
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, related_user_id: p.user_id }));
                                            setPatientSearch(`${p.full_name} (${p.dni || 'N/A'})`);
                                            setShowPatientList(false);
                                            // Trigger pricing fetch
                                            if (formData.doctor_id) {
                                                fetchPricing(formData.doctor_id, p.id);
                                            }
                                        }}
                                        style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                        onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.target.style.background = 'white'}
                                    >
                                        {p.full_name} <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{p.dni}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {formData.type === 'income_rental' && (
                <div className="input-group">
                    <label className="input-label">{t('doctor_payer')}</label>
                    <select className="input-field" value={formData.related_user_id} onChange={e => setFormData({ ...formData, related_user_id: e.target.value })}>
                        <option value="">{t('select_doctor')}</option>
                        {doctors.map(d => <option key={d.id} value={d.user_id}>{d.full_name}</option>)}
                    </select>
                </div>
            )}

            <div className="input-group">
                <label className="input-label">{t('beneficiary_doctor_cash_box')}</label>
                <select className="input-field" value={formData.doctor_id} onChange={e => {
                    const newDocId = e.target.value;
                    setFormData({ ...formData, doctor_id: newDocId });
                    if (formData.type === 'income_patient' && formData.related_user_id) {
                        const pat = patients.find(p => p.user_id === Number(formData.related_user_id));
                        if (pat) fetchPricing(newDocId, pat.id, formData.service_type);
                    }
                }}>
                    <option value="">{t('select_doctor')}</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
            </div>

            {formData.type === 'income_patient' && (
                <div className="input-group">
                    <label className="input-label">{t('service_type')}</label>
                    <select className="input-field" value={formData.service_type || 'consultation'} onChange={e => {
                        const newType = e.target.value;
                        setFormData({ ...formData, service_type: newType });
                        if (formData.doctor_id && formData.related_user_id) {
                            const pat = patients.find(p => p.user_id === Number(formData.related_user_id));
                            if (pat) {
                                fetchPricing(formData.doctor_id, pat.id, newType);
                                // Update description
                                let newDesc = '';
                                if (newType === 'consultation') newDesc = `Consultation: ${pat.full_name}`;
                                else if (newType === 'virtual_consultation') newDesc = `Virtual Cons: ${pat.full_name}`;
                                else if (newType === 'prescription') newDesc = `Prescription: ${pat.full_name}`;
                                else if (newType === 'medical_license') newDesc = `License: ${pat.full_name}`;
                                else if (newType === 'custom') newDesc = `Custom: ${pat.full_name}`;

                                setFormData(prev => ({ ...prev, service_type: newType, description: newDesc }));
                                return;
                            }
                        }
                        setFormData({ ...formData, service_type: newType });
                    }}>
                        <option value="consultation">{t('consultation_standard')}</option>
                        <option value="virtual_consultation">{t('virtual_consultation')}</option>
                        <option value="prescription">{t('prescription_rate')}</option>
                        <option value="medical_license">{t('medical_license')}</option>
                        <option value="custom">{t('custom')}</option>
                    </select>
                </div>
            )}

            <div className="input-group">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="input-label">{t('amount_paid')}</label>
                        <input type="number" className="input-field" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        {pricingInfo && (
                            <div style={{ marginTop: '0.25rem' }}>
                                <small style={{ display: 'block', color: '#64748b' }}>{pricingInfo}</small>
                                {(totalPrice - Number(formData.amount)) > 0 && (
                                    <small style={{ display: 'block', color: '#ef4444', fontWeight: 'bold' }}>
                                        {t('debt')}: ${(totalPrice - Number(formData.amount)).toFixed(2)}
                                    </small>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="input-label">{t('method')}</label>
                        <select className="input-field" value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })}>
                            <option value="cash">Cash</option>
                            <option value="debit">Debit Card</option>
                            <option value="credit">Credit Card</option>
                            <option value="transfer">Transfer</option>
                            <option value="mercadopago">MercadoPago</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="input-group">
                <label className="input-label">{t('status')}</label>
                <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="paid">{t('paid')}</option>
                    <option value="partial">{t('partial')}</option>
                    <option value="pending">{t('pending')}</option>
                </select>
            </div>

            <div className="input-group">
                <label className="input-label">{t('description')}</label>
                <input className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Consultation Dr. X" />
            </div>

            <div className="input-group">
                <label className="input-label">{t('proof_payment_optional')}</label>
                <input type="file" className="input-field" onChange={e => setFormData({ ...formData, proof: e.target.files[0] })} />
            </div>
        </Modal>
    );
};

export default TransactionModal;

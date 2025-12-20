
import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from './Modal';

const TransactionModal = ({ isOpen, onClose, onSuccess, initialData = {}, requestId }) => {
    const [formData, setFormData] = useState({
        type: 'income_patient',
        amount: '',
        description: '',
        related_user_id: '',
        doctor_id: '',
        method: 'cash',
        status: 'paid',
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
            setFormData(prev => ({
                ...prev,
                type: initialData.type || 'income_patient',
                amount: initialData.amount || '',
                description: initialData.description || '',
                related_user_id: initialData.patientUserId || initialData.patientId || '', // prefer userId, fallback (though likely wrong if fallback is patientId)
                doctor_id: initialData.doctorId || '',
                method: initialData.method || 'cash',
                status: initialData.status || 'paid'
            }));

            // Auto-fetch pricing if doctor and patient are present
            if (initialData.doctorId && initialData.patientId) {
                fetchPricing(initialData.doctorId, initialData.patientId);
            }

            // Pre-fill search if patient is set
            if (initialData.patientName) {
                setPatientSearch(`${initialData.patientName} (${initialData.patientDni || 'N/A'})`);
            } else {
                setPatientSearch('');
            }

            fetchLists();
        }
    }, [isOpen, initialData]);

    const fetchPricing = async (docId, patId, serviceType = 'consultation') => {
        try {
            const res = await api.get(`/ finances / pricing ? doctor_id = ${docId}& patient_id=${patId}& service_type=${serviceType} `);
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
            // Calculate Debt if patient income
            if (formData.type === 'income_patient' && totalPrice > 0) {
                const paid = Number(formData.amount);
                const debt = totalPrice - paid;
                if (debt > 0) {
                    data.append('debt_amount', debt);
                }
            }

            // If this transaction is related to an appointment, we might need a way to link it?
            if (requestId) {
                data.append('request_id', requestId);
            }

            const res = await api.post('/finances/transactions', data);

            if (onSuccess) onSuccess(res.data);
            onClose();
        } catch (err) {
            alert("Failed to record transaction");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Record Payment"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </>
            }
        >
            <div className="input-group">
                <label className="input-label">Type</label>
                <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="income_patient">Consultation / Patient Pay</option>
                    <option value="income_rental">Rental Payment (Doctor)</option>
                    <option value="expense_general">General Expense</option>
                </select>
            </div>

            {formData.type === 'income_patient' && (
                <div className="input-group">
                    <label className="input-label">Patient</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by name or DNI..."
                            value={patientSearch}
                            onChange={(e) => {
                                setPatientSearch(e.target.value);
                                setShowPatientList(true);
                                setFormData({ ...formData, related_user_id: '' }); // Reset selection on edit
                            }}
                            onFocus={() => {
                                if (!initialData.patientId) setShowPatientList(true);
                            }}
                            readOnly={!!initialData.patientId}
                            style={initialData.patientId ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
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
                                                fetchPricing(formData.doctor_id, p.id); // Note: we need patients.id usually, but transaction uses related_user_id (which is p.user_id). Let's check filter.
                                                // Actually the pricing logic needs the ID (table id), but transaction uses user_id.
                                                // The pricing endpoint expects patients.id.
                                                // Let's ensure we have the right IDs.
                                                // p.id is patients.id. p.user_id is users.id.
                                                // fetchPricing uses docId and patId.
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
                    <label className="input-label">Doctor (Payer)</label>
                    <select className="input-field" value={formData.related_user_id} onChange={e => setFormData({ ...formData, related_user_id: e.target.value })}>
                        <option value="">Select Doctor</option>
                        {doctors.map(d => <option key={d.id} value={d.user_id}>{d.full_name}</option>)}
                    </select>
                </div>
            )}

            <div className="input-group">
                <label className="input-label">Beneficiary Doctor (Cash Box)</label>
                <select className="input-field" value={formData.doctor_id} onChange={e => {
                    const newDocId = e.target.value;
                    setFormData({ ...formData, doctor_id: newDocId });
                    // If we have a patient selected (related_user_id is set + it's income_patient)
                    // We need the PATIENT ID (table id).
                    // This is tricky because we only stored related_user_id.
                    // Ideally we should store patient_id in state too?
                    // Let's rely on patientSearch or initialData linkage?
                    // Or iterate patients list using related_user_id to find id.
                    if (formData.type === 'income_patient' && formData.related_user_id) {
                        const pat = patients.find(p => p.user_id === Number(formData.related_user_id));
                        if (pat) fetchPricing(newDocId, pat.id, formData.service_type);
                    }
                }}>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
            </div>

            {formData.type === 'income_patient' && (
                <div className="input-group">
                    <label className="input-label">Service Type</label>
                    <select className="input-field" value={formData.service_type || 'consultation'} onChange={e => {
                        const newType = e.target.value;
                        setFormData({ ...formData, service_type: newType });
                        if (formData.doctor_id && formData.related_user_id) {
                            const pat = patients.find(p => p.user_id === Number(formData.related_user_id));
                            if (pat) fetchPricing(formData.doctor_id, pat.id, newType);
                        }
                    }}>
                        <option value="consultation">Consultation (Standard)</option>
                        <option value="virtual_consultation">Virtual Consultation</option>
                        <option value="prescription">Prescription (Rate)</option>
                        <option value="medical_license">Medical License</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
            )}

            <div className="input-group">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="input-label">Amount Paid</label>
                        <input type="number" className="input-field" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        {pricingInfo && (
                            <div style={{ marginTop: '0.25rem' }}>
                                <small style={{ display: 'block', color: '#64748b' }}>{pricingInfo}</small>
                                {(totalPrice - Number(formData.amount)) > 0 && (
                                    <small style={{ display: 'block', color: '#ef4444', fontWeight: 'bold' }}>
                                        Debt: ${(totalPrice - Number(formData.amount)).toFixed(2)}
                                    </small>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="input-label">Method</label>
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
                <label className="input-label">Status</label>
                <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="paid">Paid (Pagado)</option>
                    <option value="partial">Partial (Parcial)</option>
                    <option value="pending">Pending (Deuda)</option>
                </select>
            </div>

            <div className="input-group">
                <label className="input-label">Description</label>
                <input className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Consultation Dr. X" />
            </div>

            <div className="input-group">
                <label className="input-label">Proof of Payment (Optional)</label>
                <input type="file" className="input-field" onChange={e => setFormData({ ...formData, proof: e.target.files[0] })} />
            </div>
        </Modal>
    );
};

export default TransactionModal;

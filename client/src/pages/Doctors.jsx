import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Doctors = () => {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">Dashboard</a>
                    <a href="#" className="sidebar-link active">Doctors</a>
                </nav>
            </aside>
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="title">Doctors</h1>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search by name, specialty..."
                        className="input-field"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ maxWidth: '400px' }}
                    />
                </div>

                <div className="card">
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {filteredDoctors.length === 0 ? <li style={{ padding: '1rem', color: '#64748b' }}>No doctors found.</li> : filteredDoctors.map(d => (
                            <li key={d.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ textTransform: 'capitalize' }}>{d.full_name}</strong>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.5rem' }}>({d.specialty})</span>
                                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                                        {d.phone && `Phone: ${d.phone} | `}
                                        Office: <strong>{d.office_number || 'N/A'}</strong> |
                                        Rent: <strong>${d.rental_cost || 0} ({d.rental_type})</strong>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        Tariffs: Consult <strong>${d.consultation_price || 0}</strong> |
                                        Rx <strong>${d.prescription_price || 0}</strong> |
                                        Lic <strong>${d.medical_license_price || 0}</strong> |
                                        Virtual <strong>${d.virtual_consultation_price || 0}</strong>
                                    </div>
                                </div>
                                {user.role === 'secretary' && (
                                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleEditClick(d)}>
                                        Edit Details
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {editModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h3 style={{ marginTop: 0 }}>Edit Doctor Details</h3>

                            <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Rental</h4>
                            <div className="input-group">
                                <label className="input-label">Office Number</label>
                                <input className="input-field" value={editData.office_number} onChange={e => setEditData({ ...editData, office_number: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Rental Type</label>
                                    <select className="input-field" value={editData.rental_type} onChange={e => setEditData({ ...editData, rental_type: e.target.value })}>
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Rent Cost ($)</label>
                                    <input type="number" className="input-field" value={editData.rental_cost} onChange={e => setEditData({ ...editData, rental_cost: e.target.value })} />
                                </div>
                            </div>

                            <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Tariffs (Base Prices)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Consultation ($)</label>
                                    <input type="number" className="input-field" value={editData.consultation_price} onChange={e => setEditData({ ...editData, consultation_price: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Virtual Consult ($)</label>
                                    <input type="number" className="input-field" value={editData.virtual_consultation_price} onChange={e => setEditData({ ...editData, virtual_consultation_price: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Prescription ($)</label>
                                    <input type="number" className="input-field" value={editData.prescription_price} onChange={e => setEditData({ ...editData, prescription_price: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Medical License ($)</label>
                                    <input type="number" className="input-field" value={editData.medical_license_price} onChange={e => setEditData({ ...editData, medical_license_price: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Doctors;

import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useMessage } from '../context/MessageContext';

const Insurances = () => {
    const { showMessage } = useMessage();
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', cuit: '', website: '', email: '', phone: '', address: '', status: 'active'
    });

    const fetchInsurances = async () => {
        try {
            const res = await api.get('/insurances');
            setInsurances(res.data);
        } catch (err) {
            console.error(err);
            showMessage("Failed to fetch insurances", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsurances();
    }, []);

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({ name: '', cuit: '', website: '', email: '', phone: '', address: '', status: 'active' });
        setModalOpen(true);
    };

    const handleOpenEdit = (ins) => {
        setEditingId(ins.id);
        setFormData({
            name: ins.name,
            cuit: ins.cuit || '',
            website: ins.website || '',
            email: ins.email || '',
            phone: ins.phone || '',
            address: ins.address || '',
            status: ins.status || 'active'
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.put(`/insurances/${editingId}`, formData);
                showMessage("Insurance updated", "success");
            } else {
                await api.post('/insurances', formData);
                showMessage("Insurance created", "success");
            }
            setModalOpen(false);
            fetchInsurances();
        } catch (err) {
            console.error(err);
            showMessage("Operation failed", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/insurances/${id}`);
            showMessage("Insurance deleted", "success");
            fetchInsurances();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || "Delete failed", "error");
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="title">Obras Sociales (Insurances)</h1>
                    <button className="btn btn-primary" onClick={handleOpenCreate}>+ New Insurance</button>
                </div>

                {loading ? <p>Loading...</p> : (
                    <div className="card">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '0.5rem' }}>Name</th>
                                    <th style={{ padding: '0.5rem' }}>CUIT</th>
                                    <th style={{ padding: '0.5rem' }}>Email / Phone</th>
                                    <th style={{ padding: '0.5rem' }}>Website</th>
                                    <th style={{ padding: '0.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {insurances.map(ins => (
                                    <tr key={ins.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{ins.name}</td>
                                        <td style={{ padding: '0.5rem' }}>{ins.cuit || '-'}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <div style={{ fontSize: '0.9rem' }}>{ins.email}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{ins.phone}</div>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            {ins.website && <a href={ins.website.startsWith('http') ? ins.website : `https://${ins.website}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Link</a>}
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.8rem', marginRight: '0.5rem' }} onClick={() => handleOpenEdit(ins)}>Edit</button>
                                            <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleDelete(ins.id)}>X</button>
                                        </td>
                                    </tr>
                                ))}
                                {insurances.length === 0 && <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No insurances found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={editingId ? "Edit Insurance" : "New Insurance"}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
                        </>
                    }
                >
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">Name *</label>
                            <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">CUIT</label>
                            <input className="input-field" value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Website</label>
                            <input className="input-field" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="e.g. www.osde.com.ar" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Phone</label>
                                <input className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Address</label>
                            <input className="input-field" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
};

export default Insurances;

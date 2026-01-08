import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useMessage } from '../context/MessageContext';

const Insurances = () => {
    const { showMessage } = useMessage();
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    // Filter Logic
    const filteredInsurances = insurances.filter(ins =>
        ins.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ins.cuit && ins.cuit.includes(searchTerm)) ||
        (ins.website && ins.website.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="flex-between-center mb-6">
                    <div>
                        <h1 className="title">Obras Sociales</h1>
                        <p className="subtitle mb-0">Manage health insurance providers</p>
                    </div>
                    <button className="btn btn-primary shadow-lg hover:shadow-xl transition-all" onClick={handleOpenCreate}>
                        + New Insurance
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-8 relative">
                    <input
                        type="text"
                        placeholder="Search by name, CUIT or website..."
                        className="input-field pl-10 py-3 text-lg"
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                </div>

                {loading ? (
                    <div className="grid place-items-center h-64 text-muted">Loading insurances...</div>
                ) : (
                    <>
                        {filteredInsurances.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                                <p className="text-muted text-lg">No insurances found matching "{searchTerm}"</p>
                                {searchTerm && <button className="btn-link mt-2 text-accent" onClick={() => setSearchTerm('')}>Clear Search</button>}
                            </div>
                        ) : (
                            <div className="item-grid">
                                {filteredInsurances.map(ins => (
                                    <div key={ins.id} className="item-card group">
                                        <div className="item-header">
                                            <div className="insurance-avatar" style={{ background: '#3b82f6' }}>
                                                {getInitials(ins.name)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800 m-0 leading-tight">{ins.name}</h3>
                                                <p className="text-sm text-slate-500 m-0 mt-1">CUIT: {ins.cuit || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="item-content">
                                            <div className="insurance-details">
                                                <div className="insurance-info-row">
                                                    <span className="insurance-info-icon">📞</span>
                                                    <span className="font-medium">{ins.phone || 'No phone'}</span>
                                                </div>
                                                <div className="insurance-info-row">
                                                    <span className="insurance-info-icon">✉️</span>
                                                    <span className="text-sm">{ins.email || 'No email'}</span>
                                                </div>
                                                {ins.website && (
                                                    <div className="insurance-info-row">
                                                        <span className="insurance-info-icon">🌐</span>
                                                        <a href={ins.website.startsWith('http') ? ins.website : `https://${ins.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-full">
                                                            {ins.website}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="item-footer">
                                            <button
                                                className="btn btn-secondary btn-sm-compact"
                                                onClick={() => handleOpenEdit(ins)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm-compact"
                                                onClick={() => handleDelete(ins.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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
                    <div className="flex-col gap-4">
                        <div className="input-group">
                            <label className="input-label">Name *</label>
                            <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
                        </div>
                        <div className="input-group">
                            <label className="input-label">CUIT</label>
                            <input className="input-field" value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Website</label>
                            <input className="input-field" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="e.g. www.osde.com.ar" />
                        </div>
                        <div className="grid-2-cols">
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

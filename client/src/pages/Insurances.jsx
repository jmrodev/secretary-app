import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useModal } from '../context/ModalContext';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useMessage } from '../context/MessageContext';
import PhoneNumbersManager from '../components/PhoneNumbersManager';

const Insurances = () => {
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', cuit: '', website: '', email: '', phoneNumbers: [], address: '', status: 'active'
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
        setFormData({ name: '', cuit: '', website: '', email: '', phoneNumbers: [], address: '', status: 'active' });
        setModalOpen(true);
    };

    const handleOpenEdit = (ins) => {
        setEditingId(ins.id);
        setFormData({
            name: ins.name,
            cuit: ins.cuit || '',
            website: ins.website || '',
            email: ins.email || '',
            phoneNumbers: ins.phoneNumbers || (ins.phone ? [{ phone_number: ins.phone, is_primary: true, label: 'Celular' }] : []),
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
        if (!await confirm("Are you sure?")) return;
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
                <div className="flex-between-center mb-10">
                    <div className="page-header-minimal">
                        <p className="subtitle mb-0">Gestione las obras sociales y prepagas del sistema</p>
                    </div>
                    <button className="btn btn-primary shadow-lg hover:shadow-xl transition-all" onClick={handleOpenCreate}>
                        + Nueva Obra Social
                    </button>
                </div>

                {/* Search Bar - Standard Style */}
                <div className="search-bar-container mb-10">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, CUIT o web..."
                            className="search-bar-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex-center py-20">
                        <div className="loading-spinner"></div>
                        <p className="text-muted ml-3">Cargando obras sociales...</p>
                    </div>
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
                                    <div key={ins.id} className="card">
                                        <div className="item-header">
                                            <div className="avatar-tile" style={{ background: '#3b82f6' }}>
                                                {getInitials(ins.name)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-main-800 m-0 leading-tight">{ins.name}</h3>
                                                <p className="text-sm text-main-500 m-0 mt-1">CUIT: {ins.cuit || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="item-content">
                                            <div className="info-list">
                                                <div className="info-row">
                                                    <span className="info-icon">📍</span>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ins.address || `${ins.name} Tandil`)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-medium text-main-800 hover:text-blue-600 hover:underline text-sm truncate"
                                                    >
                                                        {ins.address || 'Buscar en mapa'}
                                                    </a>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-icon">📞</span>
                                                    <span className="font-medium text-sm">
                                                        {ins.phoneNumbers && ins.phoneNumbers.length > 0 ? (
                                                            <div className="flex flex-col">
                                                                {ins.phoneNumbers.filter(p => p.is_primary).map(p => (
                                                                    <a key={p.id} href={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`} className="text-main-800 hover:text-blue-600 hover:underline">
                                                                        {p.phone_number} {p.label && <span className="text-[10px] text-muted normal-case font-normal">({p.label})</span>}
                                                                    </a>
                                                                ))}
                                                                {ins.phoneNumbers.length > 1 && <span className="text-[10px] text-blue-500">+{ins.phoneNumbers.length - 1} más</span>}
                                                            </div>
                                                        ) : (ins.phone ? (
                                                            <a href={`tel:${ins.phone.replace(/[^0-9+]/g, '')}`} className="text-main-800 hover:text-blue-600 hover:underline">
                                                                {ins.phone}
                                                            </a>
                                                        ) : 'No phone')}
                                                    </span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-icon">✉️</span>
                                                    <span className="text-sm">
                                                        {ins.email ? (
                                                            <a href={`mailto:${ins.email}`} className="text-main-600 hover:text-blue-600 hover:underline">
                                                                {ins.email}
                                                            </a>
                                                        ) : 'No email'}
                                                    </span>
                                                </div>
                                                {ins.website && (
                                                    <div className="info-row">
                                                        <span className="info-icon">🌐</span>
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
                                                Editar
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm-compact"
                                                onClick={() => handleDelete(ins.id)}
                                            >
                                                Eliminar
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
                    title={editingId ? "Editar Obra Social" : "Nueva Obra Social"}
                    footer={
                        <>
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSubmit}>Guardar</button>
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
                        <div className="mb-4">
                            <PhoneNumbersManager
                                phoneNumbers={formData.phoneNumbers}
                                onChange={(newPhones) => setFormData({ ...formData, phoneNumbers: newPhones })}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <input className="input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Dirección</label>
                            <input className="input-field" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            {formData.address && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                    Ver en mapa ↗
                                </a>
                            )}
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
};

export default Insurances;

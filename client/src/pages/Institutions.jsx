
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useMessage } from '../context/MessageContext';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

// ... previous imports

// Sub-component for Financial Report
const InstitutionFinances = ({ institutions }) => {
    const [selectedInst, setSelectedInst] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedInst) {
            fetchReport(selectedInst);
        } else {
            setReport(null);
        }
    }, [selectedInst]);

    const fetchReport = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/institutions/${id}/finances`);
            setReport(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="card p-4 bg-slate-50">
                <label className="font-bold mr-2">Seleccionar Institución:</label>
                <select
                    className="input-field max-w-xs inline-block"
                    value={selectedInst}
                    onChange={e => setSelectedInst(e.target.value)}
                >
                    <option value="">-- Seleccionar --</option>
                    {institutions.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>
            </div>

            {loading && <div>Cargando reporte...</div>}

            {report && (
                <div className="flex flex-col gap-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="card bg-blue-50 border-blue-100">
                            <h3 className="text-blue-800 font-bold text-lg">Total Histórico</h3>
                            <p className="text-3xl text-blue-600 font-bold">${report.total_amount}</p>
                        </div>
                        <div className="card bg-red-50 border-red-100">
                            <h3 className="text-red-800 font-bold text-lg">Pendiente de Pago (Deuda)</h3>
                            <p className="text-3xl text-red-600 font-bold">${report.total_pending}</p>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="card overflow-x-auto">
                        <h3 className="title text-base mb-4">Detalle de Movimientos</h3>
                        <table className="table-base w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Paciente</th>
                                    <th>Doctor</th>
                                    <th>Estado Turno</th>
                                    <th>Monto</th>
                                    <th>Estado Pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.transactions.map(t => (
                                    <tr key={t.appointment_id}>
                                        <td>{new Date(t.appointment_date).toLocaleString()}</td>
                                        <td className="font-medium">{t.patient_name}</td>
                                        <td>{t.doctor_name}</td>
                                        <td>
                                            <span className={`tag tag-${t.status === 'completed' ? 'green' : 'gray'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="font-mono">${t.cost}</td>
                                        <td>
                                            <span className={`tag tag-${t.payment_status === 'paid' ? 'green' : t.payment_status === 'pending' ? 'yellow' : 'red'}`}>
                                                {t.payment_status === 'paid' ? 'Pagado' : t.payment_status === 'debt' ? 'Deuda' : 'Pendiente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {report.transactions.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-4">No hay movimientos registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const Institutions = () => {
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { showMessage } = useMessage();
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'finances'

    // ... Form State (name, description, status) same as before ...
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('active');

    const fetchInstitutions = async () => {
        try {
            const res = await api.get('/institutions');
            setInstitutions(res.data);
        } catch (err) {
            console.error(err);
            showMessage('Error al cargar instituciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/institutions/${editing.id}`, { name, description, status });
                showMessage('Institución actualizada', 'success');
            } else {
                await api.post('/institutions', { name, description, status });
                showMessage('Institución creada', 'success');
            }
            fetchInstitutions();
            handleCloseModal();
        } catch (err) {
            console.error(err);
            showMessage('Error al guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!await confirm('¿Seguro que deseas eliminar esta institución?')) return;
        try {
            await api.delete(`/institutions/${id}`);
            showMessage('Institución eliminada', 'success');
            fetchInstitutions();
        } catch (err) {
            console.error(err);
            showMessage('Error al eliminar', 'error');
        }
    };

    const handleOpenModal = (inst = null) => {
        if (inst) {
            setEditing(inst);
            setName(inst.name);
            setDescription(inst.description || '');
            setStatus(inst.status);
        } else {
            setEditing(null);
            setName('');
            setDescription('');
            setStatus('active');
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditing(null);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="title">🏢 Instituciones</h1>
                    <div className="flex gap-2">
                        {/* Tabs */}
                        <div className="bg-slate-200 p-1 rounded-lg flex text-sm">
                            <button
                                className={`px-4 py-1 rounded-md transition-all ${activeTab === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                                onClick={() => setActiveTab('list')}
                            >
                                Listado
                            </button>
                            <button
                                className={`px-4 py-1 rounded-md transition-all ${activeTab === 'finances' ? 'bg-white shadow text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                                onClick={() => setActiveTab('finances')}
                            >
                                📊 Finanzas
                            </button>
                        </div>

                        {activeTab === 'list' && (
                            <button className="btn btn-primary ml-4" onClick={() => handleOpenModal()}>
                                + Nueva Institución
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === 'list' ? (
                    loading ? (
                        <div>Cargando...</div>
                    ) : (
                        <div className="card">
                            <table className="table-base w-full">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {institutions.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4 text-slate-500">
                                                No hay instituciones registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        institutions.map(inst => (
                                            <tr key={inst.id}>
                                                <td className="font-medium text-slate-800">{inst.name}</td>
                                                <td className="text-sm text-slate-600">{inst.description}</td>
                                                <td>
                                                    <span className={`tag tag-${inst.status === 'active' ? 'green' : 'red'}`}>
                                                        {inst.status === 'active' ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="flex gap-2">
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleOpenModal(inst)}>
                                                        ✏️
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inst.id)}>
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <InstitutionFinances institutions={institutions} />
                )}

                <Modal
                    isOpen={modalOpen}
                    onClose={handleCloseModal}
                    title={editing ? 'Editar Institución' : 'Nueva Institución'}
                >
                    <form onSubmit={handleSubmit} className="flex-col-gap-4">
                        <div className="input-group">
                            <label className="input-label">Nombre *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Descripción</label>
                            <textarea
                                className="input-field"
                                rows="3"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Estado</label>
                            <select
                                className="input-field"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                            >
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Guardar
                            </button>
                        </div>
                    </form>
                </Modal>
            </main>
        </div>
    );
};

export default Institutions;

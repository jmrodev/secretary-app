import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';

import Modal from './Modal';

const RequirementsList = ({ user }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { doubleConfirm, confirm } = useModal();
    const [activeTab, setActiveTab] = useState('list');
    const [recycleRequests, setRecycleRequests] = useState([]);

    const fetchRecycleBin = async () => {
        if (user.role !== 'admin' && user.role !== 'secretary') return;
        try {
            const res = await api.get('/logs/recycle-bin');
            // Filter for medical_request
            setRecycleRequests(res.data.filter(item => item.entity_type === 'medical_request'));
        } catch (err) {
            console.error("Failed to fetch recycle bin", err);
        }
    };

    const handleRestore = async (item) => {
        if (await confirm(`¿Restaurar solicitud de ${item.entity_name}?`)) {
            try {
                await api.post(`/logs/restore/${item.id}`);
                showMessage('Solicitud restaurada exitosamente', 'success');
                fetchRecycleBin();
                fetchRequests(); // Refresh active list too
            } catch (err) {
                console.error(err);
                showMessage('Error al restaurar: ' + (err.response?.data?.message || err.message), 'error');
            }
        }
    };

    const openActionModal = (type, id) => {
        setActionModal({ open: true, type, id });
        setActionNote('');
    };

    const confirmAction = async () => {
        try {
            if ((actionModal.type === 'rejected' || actionModal.type === 'consult' || actionModal.type === 'reply') && !actionNote.trim()) {
                showMessage(t('note_required') || 'Note is required', 'error');
                return;
            }

            const payload = { status: actionModal.type === 'reply' ? 'consult' : actionModal.type }; // Reply keeps status as consult

            if (actionNote.trim()) {
                if (actionModal.type === 'reply') {
                    payload.secretary_note = actionNote;
                } else {
                    payload.doctor_note = actionNote;
                }
            }

            // Fixed URL: Backend route is PATCH /requests/:id
            await api.patch(`/medical/requests/${actionModal.id}`, payload);

            showMessage(t('action_success') || 'Updated successfully', 'success');
            setActionModal({ open: false, type: '', id: null });
            fetchRequests();
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || t('error_update') || 'Failed to update';
            showMessage(errMsg, 'error');
        }
    };

    const [filter, setFilter] = useState('active'); // 'active' (pending/consult) or 'history' (completed/rejected)
    const [allRequests, setAllRequests] = useState([]);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/medical/requests');
            setAllRequests(res.data);
            filterRequests(res.data, filter);
        } catch (err) {
            console.error("Failed to fetch requirements", err);
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = (data, currentFilter) => {
        if (currentFilter === 'active') {
            setRequests(data.filter(r => r.status === 'pending' || r.status === 'consult'));
        } else {
            setRequests(data.filter(r => r.status === 'completed' || r.status === 'rejected'));
        }
    };

    useEffect(() => {
        filterRequests(allRequests, filter);
    }, [filter, allRequests]);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'recycle') {
            fetchRecycleBin();
        }
    }, [activeTab]);

    const typeLabels = {
        'prescription': 'Receta 💊',
        'license': 'Licencia 📄',
        'certificate': 'Certificado 📜',
        'referral': 'Derivación 📋'
    };

    if (loading) return <div>Cargando requerimientos...</div>;



    const handleDeleteClick = async (id) => {
        if (await doubleConfirm(
            t('confirm_delete') || '¿Seguro que desea eliminar?',
            t('confirm_permanent_delete') || 'Esta acción eliminará el registro permanentemente. ¿Confirmar segunda vez?'
        )) {
            try {
                await api.delete(`/medical/requests/${id}`);
                showMessage('Solicitud eliminada correctamente', 'success');
                fetchRequests();
            } catch (err) {
                console.error("Failed to delete", err);
                showMessage("Error al eliminar: " + (err.response?.data?.message || err.message), 'error');
            }
        }
    };

    return (
        <div className="table-responsive">
            {/* Navigation Tabs */}
            {(user.role === 'admin' || user.role === 'secretary') && (
                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        📋 Listado Activo
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'recycle' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recycle')}
                    >
                        🗑️ Papelera {recycleRequests.length > 0 && <span className="ml-2 bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full text-xs">{recycleRequests.length}</span>}
                    </button>
                </div>
            )}

            {activeTab === 'list' ? (
                <>
                    <div className="flex gap-2 mb-4">
                        <button
                            className={`tab-btn-small ${filter === 'active' ? 'active' : ''}`}
                            onClick={() => setFilter('active')}
                        >
                            {t('pending') || 'Pendientes'}
                        </button>
                        <button
                            className={`tab-btn-small ${filter === 'history' ? 'active' : ''}`}
                            onClick={() => setFilter('history')}
                        >
                            {t('history') || 'Historial'}
                        </button>
                    </div>

                    {requests.length === 0 ? (
                        <div className="no-requirements-msg mt-4">{t('no_requests') || (filter === 'active' ? 'No hay requerimientos pendientes.' : 'No hay historial.')}</div>
                    ) : (
                        <table className="table-base requirements-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Fecha</th>
                                    <th>Paciente</th>
                                    <th>Doctor</th>
                                    <th>Solicitado Por</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td>
                                            <span
                                                className={`status-chip ${r.type === 'prescription' ? 'chip-blue' : 'chip-green'} type-chip-link cursor-pointer`}
                                                onClick={() => setSelectedRequest(r)}
                                                title="Ver detalle"
                                            >
                                                {typeLabels[r.type] || r.type}
                                            </span>
                                        </td>
                                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <strong>{r.patient_name}</strong>
                                        </td>
                                        <td>
                                            <span className="text-muted">Dr. {r.doctor_name}</span>
                                        </td>
                                        <td>
                                            <span className="text-xs text-gray-500">{r.secretary_name || 'Secretaría'}</span>
                                        </td>
                                        <td>
                                            <span className={`status-chip chip-yellow`}>
                                                {t(r.status) || r.status}
                                            </span>
                                        </td>
                                        <td>
                                            {(user.role === 'admin' || user.role === 'secretary' || user.role === 'doctor') && (
                                                <div className="flex gap-1 justify-end">
                                                    {(user.role === 'admin' || user.role === 'secretary') && (
                                                        <button
                                                            className="btn-icon-base btn-icon-red"
                                                            onClick={() => handleDeleteClick(r.id)}
                                                            title="Eliminar"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                    {(user.role === 'secretary' || user.role === 'admin') && r.status === 'consult' && (
                                                        <button
                                                            className="btn-icon-base btn-icon-blue"
                                                            onClick={() => openActionModal('reply', r.id)}
                                                            title={t('reply')}
                                                        >
                                                            💬
                                                        </button>
                                                    )}
                                                    {(r.status === 'pending' || r.status === 'consult') && (
                                                        <>
                                                            <button
                                                                className="btn-icon-base btn-icon-green"
                                                                onClick={() => openActionModal('completed', r.id)}
                                                                title={t('mark_as_done')}
                                                            >
                                                                ✅
                                                            </button>
                                                            <button
                                                                className="btn-icon-base btn-icon-yellow"
                                                                onClick={() => openActionModal('consult', r.id)}
                                                                title={t('consult_secretary')}
                                                            >
                                                                ❓
                                                            </button>
                                                            <button
                                                                className="btn-icon-base btn-icon-red"
                                                                onClick={() => openActionModal('rejected', r.id)}
                                                                title={t('reject')}
                                                            >
                                                                ❌
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    )}
                </>
            ) : (
                <div className="recycle-bin-view">
                    {recycleRequests.length === 0 ? (
                        <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-muted">
                            <span className="text-4xl block mb-2">🗑️</span>
                            No hay elementos en la papelera.
                        </div>
                    ) : (
                        <table className="table-base requirements-table">
                            <thead>
                                <tr>
                                    <th>Elemento</th>
                                    <th>Eliminado Por</th>
                                    <th>Fecha Eliminación</th>
                                    <th>Expira</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recycleRequests.map(item => (
                                    <tr key={item.id} className="bg-red-50/30">
                                        <td>
                                            <strong>{item.entity_name}</strong>
                                        </td>
                                        <td>{item.deleted_by_name}</td>
                                        <td>{new Date(item.deleted_at).toLocaleString()}</td>
                                        <td className="text-red-600 font-bold">{new Date(item.expires_at).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm text-green-600 bg-green-100 hover:bg-green-200"
                                                onClick={() => handleRestore(item)}
                                            >
                                                ♻️ Restaurar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Detalle de Solicitud"
            >
                {selectedRequest && (
                    <div>
                        <div className="mb-4">
                            <strong>Paciente:</strong> {selectedRequest.patient_name} <br />
                            <small className="text-muted">DNI: {selectedRequest.patient_dni}</small>
                        </div>
                        <div className="mb-4">
                            <strong>Doctor:</strong> {selectedRequest.doctor_name}
                        </div>
                        <div className="mb-4">
                            <strong>Tipo:</strong> {typeLabels[selectedRequest.type] || selectedRequest.type}
                        </div>
                        <div className="mb-4 text-sm text-gray-700">
                            <div><strong>Solicitado:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</div>
                            {selectedRequest.completed_at && (
                                <>
                                    <div><strong>Respuesta:</strong> {new Date(selectedRequest.completed_at).toLocaleString()}</div>
                                    <div className="text-blue-600 font-bold">
                                        Tiempo Transcurrido: {(() => {
                                            const start = new Date(selectedRequest.created_at);
                                            const end = new Date(selectedRequest.completed_at);
                                            const diff = end - start;
                                            const minutes = Math.floor(diff / 60000);
                                            const hours = Math.floor(minutes / 60);
                                            if (hours > 0) return `${hours} h ${minutes % 60} min`;
                                            return `${minutes} min`;
                                        })()}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 rounded border mb-4">
                            <strong>Detalle / Medicación:</strong>
                            <pre className="note-pre">
                                {selectedRequest.request_note || "Sin detalles adicionales."}
                            </pre>
                        </div>

                        {selectedRequest.doctor_note && (
                            <div className="p-4 bg-green-50 rounded border mb-4">
                                <strong>{t('doctor_note')}:</strong>
                                <pre className="note-pre">
                                    {selectedRequest.doctor_note}
                                </pre>
                            </div>
                        )}
                        {selectedRequest.secretary_note && (
                            <div className="p-4 bg-blue-50 rounded border mb-4">
                                <strong>{t('secretary_reply')}:</strong>
                                <pre className="note-pre">
                                    {selectedRequest.secretary_note}
                                </pre>
                            </div>
                        )}

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal >

            {/* Doctor Action Modal */}
            <Modal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ open: false, type: '', id: null })}
                title={
                    actionModal.type === 'completed' ? t('mark_as_done') :
                        (actionModal.type === 'rejected' ? t('reject_request') :
                            (actionModal.type === 'consult' ? t('consult_secretary') :
                                (actionModal.type === 'reply' ? t('reply_to_doctor') : 'Action')))
                }
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setActionModal({ open: false, type: '', id: null })}>{t('cancel')}</button>
                        <button className="btn btn-primary" onClick={confirmAction}>
                            {actionModal.type === 'consult' ? t('send_message') : t('confirm')}
                        </button>
                    </>
                }
            >
                <div className="input-group">
                    <label className="input-label">
                        {actionModal.type === 'consult' ? t('your_question') :
                            (actionModal.type === 'reply' ? t('your_answer') : t('doctor_note'))}
                        {(actionModal.type === 'rejected' || actionModal.type === 'consult' || actionModal.type === 'reply') && <span className="required-star"> *</span>}
                    </label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={actionNote}
                        onChange={e => setActionNote(e.target.value)}
                        placeholder={
                            actionModal.type === 'consult' ? t('consult_placeholder') || "Escriba su consulta para la secretaria..." :
                                (actionModal.type === 'rejected' ? t('reject_reason') || "Motivo del rechazo..." :
                                    (actionModal.type === 'reply' ? t('reply_placeholder') || "Escriba su respuesta..." :
                                        t('optional_note') || "Nota opcional..."))
                        }
                    ></textarea>
                </div>
            </Modal >


        </div >
    );
};

export default RequirementsList;

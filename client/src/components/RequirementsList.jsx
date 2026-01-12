import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';

import Modal from './Modal';

const RequirementsList = ({ user }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const { showMessage } = useMessage();
    const { t } = useLanguage(); // Ensure t is available

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

    const typeLabels = {
        'prescription': 'Receta 💊',
        'license': 'Licencia 📄',
        'certificate': 'Certificado 📜',
        'referral': 'Derivación 📋'
    };

    if (loading) return <div>Cargando requerimientos...</div>;



    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.delete(`/medical/requests/${confirmDeleteId}`);
            showMessage('Solicitud eliminada correctamente', 'success');
            fetchRequests(); // Refresh list
        } catch (err) {
            console.error("Failed to delete", err);
            showMessage("Error al eliminar: " + (err.response?.data?.message || err.message), 'error');
        } finally {
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="table-responsive">
            <div className="flex gap-2 mb-4">
                <button
                    className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('active')}
                >
                    {t('pending') || 'Pendientes'}
                </button>
                <button
                    className={`btn btn-sm ${filter === 'history' ? 'btn-primary' : 'btn-secondary'}`}
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
                            <th>Paciente</th>
                            <th>Doctor</th>
                            <th>Solicitado Por</th>
                            <th>Estado</th>
                            {user.role === 'admin' && <th>Acciones</th>}
                            {user.role === 'doctor' && <th>Gestionar</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => (
                            <tr key={r.id}>
                                <td>
                                    <span
                                        className={`status-chip ${r.type === 'prescription' ? 'chip-blue' : 'chip-green'} type-chip-link`}
                                        onClick={() => setSelectedRequest(r)}
                                        title="Ver detalle"
                                    >
                                        {typeLabels[r.type] || r.type}
                                    </span>
                                </td>
                                <td className="font-bold">{r.patient_name}</td>
                                <td>{r.doctor_name}</td>
                                <td>{r.secretary_name || 'Secretaría'}</td>
                                <td>
                                    <span className="status-chip chip-yellow">
                                        {r.status}
                                    </span>
                                </td>
                                {(user.role === 'admin' || user.role === 'secretary') && (
                                    <td className="actions-flex">
                                        {user.role === 'admin' && (
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
                                    </td>
                                )}
                                {
                                    user.role === 'doctor' && (
                                        <td className="actions-flex">
                                            {r.status === 'pending' || r.status === 'consult' ? (
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
                                            ) : (
                                                <span className="status-placeholder">-</span>
                                            )}
                                        </td>
                                    )
                                }
                            </tr>
                        ))}
                    </tbody>
                </table>
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
            < Modal
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

            {/* Delete Confirmation Modal */}
            < Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Confirmar Eliminación"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                        <button className="btn btn-danger-custom" onClick={confirmDelete}>Eliminar</button>
                    </>
                }
            >
                <p>¿Seguro que desea eliminar esta solicitud?</p>
                <p className="text-sm text-muted">Esta acción no se puede deshacer.</p>
            </Modal >
        </div >
    );
};

export default RequirementsList;

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
            if (actionModal.type === 'reply') {
                payload.secretary_note = actionNote;
            } else {
                payload.doctor_note = actionNote;
            }

            await api.patch(`/medical/requests/${actionModal.id}/status`, payload);

            showMessage(t('action_success') || 'Updated successfully', 'success');
            setActionModal({ open: false, type: '', id: null });
            fetchRequests();
        } catch (err) {
            console.error(err);
            showMessage(t('error_update') || 'Failed to update', 'error');
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get('/medical/requests');
            // Filter for "active" or "in progress" if needed, 
            // but 'pending' is usually what "que estan realizandose" means.
            // The backend returns all, let's filter specifically for pending/in-process.
            const active = res.data.filter(r => r.status === 'pending');
            setRequests(active);
        } catch (err) {
            console.error("Failed to fetch requirements", err);
        } finally {
            setLoading(false);
        }
    };

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

    if (requests.length === 0) {
        return <div className="text-muted" style={{ padding: '1rem', fontStyle: 'italic' }}>No hay requerimientos pendientes.</div>;
    }

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
            <table className="table-base" style={{ fontSize: '0.9rem' }}>
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
                                    className={`status-chip ${r.type === 'prescription' ? 'chip-blue' : 'chip-green'}`}
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
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
                                <td style={{ display: 'flex', gap: '5px' }}>
                                    {user.role === 'admin' && (
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => handleDeleteClick(r.id)}
                                            title="Eliminar"
                                            style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                    {(user.role === 'secretary' || user.role === 'admin') && r.status === 'consult' && (
                                        <button
                                            className="btn-icon"
                                            onClick={() => openActionModal('reply', r.id)}
                                            title={t('reply')}
                                            style={{ color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer' }}
                                        >
                                            💬
                                        </button>
                                    )}
                                </td>
                            )}
                            {
                                user.role === 'doctor' && (
                                    <td style={{ display: 'flex', gap: '5px' }}>
                                        {r.status === 'pending' || r.status === 'consult' ? (
                                            <>
                                                <button
                                                    className="btn btn-icon"
                                                    onClick={() => openActionModal('completed', r.id)}
                                                    title={t('mark_as_done')}
                                                    style={{ color: '#16a34a', border: 'none', background: 'none', cursor: 'pointer' }}
                                                >
                                                    ✅
                                                </button>
                                                <button
                                                    className="btn btn-icon"
                                                    onClick={() => openActionModal('consult', r.id)}
                                                    title={t('consult_secretary')}
                                                    style={{ color: '#eab308', border: 'none', background: 'none', cursor: 'pointer' }}
                                                >
                                                    ❓
                                                </button>
                                                <button
                                                    className="btn btn-icon"
                                                    onClick={() => openActionModal('rejected', r.id)}
                                                    title={t('reject')}
                                                    style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                                                >
                                                    ❌
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>
                                        )}
                                    </td>
                                )
                            }
                        </tr>
                    ))}
                </tbody>
            </table>

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
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', marginTop: '5px' }}>
                                {selectedRequest.request_note || "Sin detalles adicionales."}
                            </pre>
                        </div>

                        {selectedRequest.doctor_note && (
                            <div className="p-4 bg-green-50 rounded border mb-4">
                                <strong>{t('doctor_note')}:</strong>
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', marginTop: '5px' }}>
                                    {selectedRequest.doctor_note}
                                </pre>
                            </div>
                        )}
                        {selectedRequest.secretary_note && (
                            <div className="p-4 bg-blue-50 rounded border mb-4">
                                <strong>{t('secretary_reply')}:</strong>
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', marginTop: '5px' }}>
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
                        {(actionModal.type === 'rejected' || actionModal.type === 'consult' || actionModal.type === 'reply') && <span style={{ color: 'red' }}> *</span>}
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
                        <button className="btn btn-danger" style={{ background: '#ef4444', color: 'white' }} onClick={confirmDelete}>Eliminar</button>
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

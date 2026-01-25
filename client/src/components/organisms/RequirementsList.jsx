import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRequirementsController } from '../../controllers/useRequirementsController';

// Components
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import TabButton from '../atoms/TabButton';
import MedicalRequestForm from './MedicalRequestForm';

/**
 * RequirementsList Organism.
 * Displays and manages medical requests with list, new, and recycle bin views.
 * Uses BEM naming convention.
 */
const RequirementsList = ({ user }) => {
    const { t } = useLanguage();
    const {
        requests,
        loading,
        selectedRequest,
        setSelectedRequest,
        actionModal,
        setActionModal,
        actionNote,
        setActionNote,
        activeTab,
        setActiveTab,
        recycleRequests,
        doctors,
        filter,
        setFilter,
        handleRestore,
        openActionModal,
        confirmAction,
        handleDelete,
        fetchRequests
    } = useRequirementsController(user);

    const typeLabels = {
        'prescription': 'Receta 💊',
        'license': 'Licencia 📄',
        'certificate': 'Certificado 📜',
        'referral': 'Derivación 📋'
    };

    if (loading) return <div className="requirements-list__loading">Cargando requerimientos...</div>;

    const isAdminOrSecretary = ['admin', 'secretary'].includes(user.role);

    return (
        <div className="requirements-list">
            {/* Top Level Navigation */}
            <nav className="requirements-list__nav tabs-container">
                <TabButton
                    isActive={activeTab === 'list'}
                    onClick={() => setActiveTab('list')}
                >
                    📋 {t('request_status')}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'new'}
                    onClick={() => setActiveTab('new')}
                >
                    ➕ {t('new_request')}
                </TabButton>
                {isAdminOrSecretary && (
                    <TabButton
                        isActive={activeTab === 'recycle'}
                        onClick={() => setActiveTab('recycle')}
                    >
                        🗑️ Papelera {recycleRequests.length > 0 && (
                            <span className="requirements-list__count ml-2 bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full text-xs">
                                {recycleRequests.length}
                            </span>
                        )}
                    </TabButton>
                )}
            </nav>

            {activeTab === 'new' ? (
                <div className="requirements-list__form-view animate-fadeIn mt-4">
                    <MedicalRequestForm
                        doctors={doctors}
                        onRequestCreated={() => {
                            fetchRequests();
                            setActiveTab('list');
                        }}
                    />
                </div>
            ) : activeTab === 'list' ? (
                <div className="requirements-list__list-view">
                    {/* Status Filters */}
                    <div className="requirements-list__filters flex gap-2 mb-4">
                        <TabButton
                            variant="pill"
                            isActive={filter === 'active'}
                            onClick={() => setFilter('active')}
                        >
                            {t('pending') || 'Pendientes'}
                        </TabButton>
                        <TabButton
                            variant="pill"
                            isActive={filter === 'history'}
                            onClick={() => setFilter('history')}
                        >
                            {t('history') || 'Historial'}
                        </TabButton>
                    </div>

                    {requests.length === 0 ? (
                        <div className="requirements-list__empty no-requirements-msg mt-4">
                            {t('no_requests') || (filter === 'active' ? 'No hay requerimientos pendientes.' : 'No hay historial.')}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-base requirements-list__table">
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
                                        <tr key={r.id}>
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
                                            <td><strong>{r.patient_name}</strong></td>
                                            <td><span className="text-muted">Dr. {r.doctor_name}</span></td>
                                            <td>
                                                <span className="requirements-list__author text-xs text-slate-500">
                                                    {r.secretary_name || 'Secretaría'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-chip chip-yellow`}>
                                                    {t(r.status) || r.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex gap-1 justify-end">
                                                    {isAdminOrSecretary && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm-compact"
                                                            className="btn-icon-base btn-icon-red"
                                                            onClick={() => handleDelete(r.id)}
                                                            title="Eliminar"
                                                        >
                                                            🗑️
                                                        </Button>
                                                    )}
                                                    {isAdminOrSecretary && r.status === 'consult' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm-compact"
                                                            className="btn-icon-base btn-icon-blue"
                                                            onClick={() => openActionModal('reply', r.id)}
                                                            title={t('reply')}
                                                        >
                                                            💬
                                                        </Button>
                                                    )}
                                                    {(r.status === 'pending' || r.status === 'consult') && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm-compact"
                                                                className="btn-icon-base btn-icon-green"
                                                                onClick={() => openActionModal('completed', r.id)}
                                                                title={t('mark_as_done')}
                                                            >
                                                                ✅
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm-compact"
                                                                className="btn-icon-base btn-icon-yellow"
                                                                onClick={() => openActionModal('consult', r.id)}
                                                                title={t('consult_secretary')}
                                                            >
                                                                ❓
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm-compact"
                                                                className="btn-icon-base btn-icon-red"
                                                                onClick={() => openActionModal('rejected', r.id)}
                                                                title={t('reject')}
                                                            >
                                                                ❌
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="requirements-list__recycle-view">
                    {recycleRequests.length === 0 ? (
                        <div className="requirements-list__recycle-empty text-center p-12 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-muted">
                            <span className="text-4xl block mb-2">🗑️</span>
                            No hay elementos en la papelera.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-base requirements-list__table">
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
                                            <td><strong>{item.entity_name}</strong></td>
                                            <td>{item.deleted_by_name}</td>
                                            <td>{new Date(item.deleted_at).toLocaleString()}</td>
                                            <td className="text-red-600 font-bold">
                                                {new Date(item.expires_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    className="text-green-600 bg-green-100 hover:bg-green-200"
                                                    onClick={() => handleRestore(item)}
                                                >
                                                    ♻️ Restaurar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                    <div className="requirements-list__detail">
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
                        <div className="requirements-list__timestamps mb-4 text-sm text-slate-700">
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
                        <div className="requirements-list__note-box p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
                            <strong>Detalle / Medicación:</strong>
                            <pre className="requirements-list__note-pre whitespace-pre-wrap mt-2 font-sans text-sm">
                                {selectedRequest.request_note || "Sin detalles adicionales."}
                            </pre>
                        </div>

                        {selectedRequest.doctor_note && (
                            <div className="requirements-list__note-box p-4 bg-green-50 rounded border border-green-200 mb-4 text-sm">
                                <strong>{t('doctor_note')}:</strong>
                                <pre className="requirements-list__note-pre whitespace-pre-wrap mt-2 font-sans">
                                    {selectedRequest.doctor_note}
                                </pre>
                            </div>
                        )}
                        {selectedRequest.secretary_note && (
                            <div className="requirements-list__note-box p-4 bg-blue-50 rounded border border-blue-200 mb-4 text-sm">
                                <strong>{t('secretary_reply')}:</strong>
                                <pre className="requirements-list__note-pre whitespace-pre-wrap mt-2 font-sans">
                                    {selectedRequest.secretary_note}
                                </pre>
                            </div>
                        )}

                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setSelectedRequest(null)} variant="secondary">
                                Cerrar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Modal (Doctor/Secretary) */}
            <Modal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ open: false, type: '', id: null })}
                title={
                    actionModal.type === 'completed' ? t('mark_as_done') :
                        (actionModal.type === 'rejected' ? t('reject_request') :
                            (actionModal.type === 'consult' ? t('consult_secretary') :
                                (actionModal.type === 'reply' ? t('reply_to_doctor') : 'Acción')))
                }
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setActionModal({ open: false, type: '', id: null })}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={confirmAction}>
                            {actionModal.type === 'consult' ? t('send_message') : t('confirm')}
                        </Button>
                    </>
                }
            >
                <div className="input-group">
                    <label className="input-label">
                        {actionModal.type === 'consult' ? t('your_question') :
                            (actionModal.type === 'reply' ? t('your_answer') : t('doctor_note'))}
                        {['rejected', 'consult', 'reply'].includes(actionModal.type) && <span className="text-red-500"> *</span>}
                    </label>
                    <textarea
                        className="input-field"
                        rows="3"
                        value={actionNote}
                        onChange={e => setActionNote(e.target.value)}
                        placeholder={
                            actionModal.type === 'consult' ? t('consult_placeholder') || "Escriba su consulta..." :
                                (actionModal.type === 'rejected' ? t('reject_reason') || "Motivo del rechazo..." :
                                    (actionModal.type === 'reply' ? t('reply_placeholder') || "Escriba su respuesta..." :
                                        t('optional_note') || "Nota opcional..."))
                        }
                    ></textarea>
                </div>
            </Modal>
        </div>
    );
};

export default RequirementsList;

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRequirementsController } from '../../controllers/useRequirementsController';
import api from '../../api/axios';

// Components
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import TabButton from '../atoms/TabButton';
import Badge from '../atoms/Badge';
import Input from '../atoms/Input';
import MedicalRequestForm from './MedicalRequestForm';
import MedicationCard from '../molecules/MedicationCard';
import MedicationEditor from '../molecules/MedicationEditor';
import RequirementItem from '../molecules/RequirementItem';

// Helpers
import { extractMedicationDetails, calculateDuration } from '../../utils/medicationHelpers';

// Styles
import './RequirementsList.css';

/**
 * RequirementsList Organism.
 * Displays and manages medical requests with list, new, and recycle bin views.
 * Refactored to follow Atomic Design and BEM conventions.
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
        fetchRequests,
        checkIsKnown,
        canDeleteRequest,
        // Medication / Edit
        isEditing, setIsEditing,
        editMeds, setEditMeds,
        editNotes, setEditNotes,
        newMedInput, setNewMedInput,
        addToChronic, handleSaveEdit,
        updateEditMed, handleAddMed
    } = useRequirementsController(user);

    const handleCloseDetail = () => setSelectedRequest(null);
    const handleCloseAction = () => setActionModal({ open: false, type: '', id: null });
    const handleOpenEdit = () => setIsEditing(true);
    const handleCancelEdit = () => setIsEditing(false);
    const handleNewTab = () => setActiveTab('new');
    const handleListTab = () => setActiveTab('list');
    const handleRecycleTab = () => setActiveTab('recycle');

    const typeLabels = {
        'prescription': 'Receta 💊',
        'license': 'Licencia 📄',
        'certificate': 'Certificado 📜',
        'referral': 'Derivación 📋'
    };

    if (loading) return <div className="requirements-list__loading">{t('loading') || 'Cargando...'}</div>;

    const isAdminOrSecretary = ['admin', 'secretary'].includes(user.role);
    const canEdit = user.role === 'admin' || user.role === 'secretary' || user.role === 'doctor';

    return (
        <div className="requirements-list">
            <nav className="requirements-list__nav nav-tabs nav-tabs--requirements">
                <div className="nav-tabs__container">
                    <TabButton
                        isActive={activeTab === 'list'}
                        onClick={handleListTab}
                        variant="pill"
                    >
                        📋 {t('request_status')}
                    </TabButton>
                    <TabButton
                        isActive={activeTab === 'new'}
                        onClick={handleNewTab}
                        variant="pill"
                    >
                        ➕ {t('new_request')}
                    </TabButton>
                    {isAdminOrSecretary && canDeleteRequest && (
                        <TabButton
                            isActive={activeTab === 'recycle'}
                            onClick={handleRecycleTab}
                            variant="pill"
                        >
                            🗑️ {t('recycle_bin') || 'Papelera'} {recycleRequests.length > 0 && (
                                <span className="dashboard__nav-badge">{recycleRequests.length}</span>
                            )}
                        </TabButton>
                    )}
                </div>
            </nav>

            {activeTab === 'new' ? (
                <div className="requirements-list__form-view">
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
                    <div className="nav-tabs nav-tabs--filters mb-4">
                        <div className="nav-tabs__container">
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
                    </div>

                    {requests.length === 0 ? (
                        <div className="requirements-list__empty">
                            {t('no_requests') || (filter === 'active' ? 'No hay requerimientos pendientes.' : 'No hay historial.')}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('type') || 'Tipo'}</th>
                                        <th>{t('date') || 'Fecha'}</th>
                                        <th>{t('patient') || 'Paciente'}</th>
                                        <th>{t('doctor') || 'Doctor'}</th>
                                        <th>{t('requested_by') || 'Solicitado Por'}</th>
                                        <th>{t('status') || 'Estado'}</th>
                                        <th>{t('actions') || 'Acciones'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(r => (
                                        <RequirementItem
                                            key={r.id}
                                            request={r}
                                            typeLabel={typeLabels[r.type] || r.type}
                                            onSelect={setSelectedRequest}
                                            onDelete={handleDelete}
                                            onAction={openActionModal}
                                            canDelete={canDeleteRequest}
                                            isAdminOrSecretary={isAdminOrSecretary}
                                            t={t}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="requirements-list__recycle-view">
                    {recycleRequests.length === 0 ? (
                        <div className="requirements-list__empty">
                            🗑️ {t('recycle_empty') || 'No hay elementos en la papelera.'}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('element') || 'Elemento'}</th>
                                        <th>{t('deleted_by') || 'Eliminado Por'}</th>
                                        <th>{t('delete_date') || 'Fecha Eliminación'}</th>
                                        <th>{t('expires') || 'Expira'}</th>
                                        <th>{t('actions') || 'Acciones'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recycleRequests.map(item => (
                                        <tr key={item.id}>
                                            <td><strong>{item.entity_name}</strong></td>
                                            <td>{item.deleted_by_name}</td>
                                            <td>{new Date(item.deleted_at).toLocaleString()}</td>
                                            <td>{new Date(item.expires_at).toLocaleDateString()}</td>
                                            <td>
                                                <Button size="sm" onClick={() => handleRestore(item)}>
                                                    ♻️ {t('restore') || 'Restaurar'}
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
                onClose={handleCloseDetail}
                title={t('request_detail') || "Detalle de Solicitud"}
            >
                {selectedRequest && (
                    <div className="requirements-detail">
                        <div className="requirements-detail__header">
                            <div className="requirements-detail__patient">
                                <span className="requirements-detail__patient-name">{selectedRequest.patient_name}</span>
                                <small className="requirements-detail__patient-dni">DNI: {selectedRequest.patient_dni}</small>
                            </div>
                            <div className="requirements-detail__doctor">
                                <strong>{t('doctor')}:</strong>
                                <span className="text-muted">Dr. {selectedRequest.doctor_name}</span>
                            </div>
                        </div>

                        <div className="requirements-detail__info-bar">
                            <Badge variant={selectedRequest.type === 'prescription' ? 'blue' : 'green'}>
                                {typeLabels[selectedRequest.type] || selectedRequest.type}
                            </Badge>
                            {canEdit && !isEditing && (
                                <Button size="sm-compact" variant="secondary" onClick={handleOpenEdit}>
                                    ✏️ {t('edit_list') || 'Editar Lista'}
                                </Button>
                            )}
                        </div>

                        <div className={`requirements-detail__note-box ${isEditing ? 'requirements-detail__note-box--editing' : ''}`}>
                            {isEditing ? (
                                <div className="requirements-edit">
                                    <h4 className="requirements-detail__title">📝 {t('editing_medication') || 'Editando Medicación'}</h4>
                                    <MedicationEditor
                                        meds={editMeds}
                                        onMedChange={updateEditMed}
                                        onRemoveMed={(idx) => setEditMeds(prev => prev.filter((_, i) => i !== idx))}
                                        newMed={newMedInput}
                                        onNewMedChange={(field, val) => setNewMedInput(prev => ({ ...prev, [field]: val }))}
                                        onAddMed={handleAddMed}
                                        t={t}
                                    />
                                    <div className="requirements-detail__notes-section">
                                        <label className="requirements-detail__notes-label">{t('additional_notes') || 'Notas Adicionales'}</label>
                                        <Input
                                            type="textarea"
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="requirements-detail__edit-actions">
                                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                            {t('cancel')}
                                        </Button>
                                        <Button size="sm" variant="primary" onClick={handleSaveEdit}>
                                            💾 {t('save_changes')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                (() => {
                                    const { meds, notes } = extractMedicationDetails(selectedRequest);
                                    const knownMeds = meds.filter(m => checkIsKnown(m.name));
                                    const unknownMeds = meds.filter(m => !checkIsKnown(m.name));

                                    return (
                                        <div className="requirements-content">
                                            {meds.length > 0 && (
                                                <div className="medication-list">
                                                    <h4 className="requirements-detail__title">💊 {t('requested_medication') || 'Medicación Solicitada'}</h4>

                                                    {unknownMeds.length > 0 && (
                                                        <div className="requirements-detail__group">
                                                            <h5 className="requirements-detail__group-title requirements-detail__group-title--unknown">
                                                                ⚠️ {t('new_meds_warning') || 'Nuevos / No Habituales'}
                                                            </h5>
                                                            <div className="requirements-detail__med-grid">
                                                                {unknownMeds.map((m, i) => (
                                                                    <MedicationCard
                                                                        key={i}
                                                                        {...m}
                                                                        isKnown={false}
                                                                        canEdit={canEdit}
                                                                        onSave={addToChronic}
                                                                        duration={calculateDuration(m.quantity, m.frequency)}
                                                                        t={t}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {knownMeds.length > 0 && (
                                                        <div className="requirements-detail__group">
                                                            <h5 className="requirements-detail__group-title requirements-detail__group-title--known">
                                                                {t('habitual_meds') || 'Habituales (Validado)'}
                                                            </h5>
                                                            <div className="requirements-detail__med-grid">
                                                                {knownMeds.map((m, i) => (
                                                                    <MedicationCard
                                                                        key={i}
                                                                        {...m}
                                                                        isKnown={true}
                                                                        duration={calculateDuration(m.quantity, m.frequency)}
                                                                        t={t}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {notes && (
                                                <div className="requirements-detail__notes-section">
                                                    <strong className="requirements-detail__notes-label">
                                                        {meds.length > 0 ? '📝 ' + t('additional_notes') + ':' : t('detail_reason') + ':'}
                                                    </strong>
                                                    <div className="requirements-detail__notes-content">
                                                        {notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            )}
                        </div>

                        {selectedRequest.doctor_note && (
                            <div className="requirements-detail__doctor-note">
                                <strong>{t('doctor_note')}:</strong>
                                <div className="requirements-detail__notes-content mt-2">{selectedRequest.doctor_note}</div>
                            </div>
                        )}
                        {selectedRequest.secretary_note && (
                            <div className="requirements-detail__secretary-note">
                                <strong>{t('secretary_reply')}:</strong>
                                <div className="requirements-detail__notes-content mt-2">{selectedRequest.secretary_note}</div>
                            </div>
                        )}

                        <div className="requirements-detail__footer">
                            <Button onClick={handleCloseDetail} variant="secondary">
                                {t('close')}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Modal */}
            <Modal
                isOpen={actionModal.open}
                onClose={handleCloseAction}
                title={
                    actionModal.type === 'completed' ? t('mark_as_done') :
                        (actionModal.type === 'rejected' ? t('reject_request') :
                            (actionModal.type === 'consult' ? t('consult_secretary') :
                                (actionModal.type === 'reply' ? t('reply_to_doctor') : 'Acción')))
                }
                footer={
                    <>
                        <Button variant="secondary" onClick={handleCloseAction}>
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
                    <Input
                        type="textarea"
                        rows="3"
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default RequirementsList;

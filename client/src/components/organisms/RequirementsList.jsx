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
import Icon from '../atoms/Icon';
import FormGroup from '../molecules/FormGroup';
import MedicalRequestForm from './MedicalRequestForm';
import MedicationCard from '../molecules/MedicationCard';
import MedicationEditor from '../molecules/MedicationEditor';
import RequirementItem from '../molecules/RequirementItem';

// Helpers
import { extractMedicationDetails, calculateDuration } from '../../utils/medicationHelpers';

// Styles
import './RequirementsList.css';

import Loading from '../atoms/Loading';

/**
 * RequirementsList Organism.
 * Displays and manages medical requests with list, new, and recycle bin views.
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
        updateEditMed, handleAddMed,
        editDoctorNote, setEditDoctorNote
    } = useRequirementsController(user);

    const handleCloseDetail = () => setSelectedRequest(null);
    const handleCloseAction = () => setActionModal({ open: false, type: '', id: null });
    const handleOpenEdit = () => setIsEditing(true);
    const handleCancelEdit = () => setIsEditing(false);
    const handleNewTab = () => setActiveTab('new');
    const handleListTab = () => setActiveTab('list');
    const handleRecycleTab = () => setActiveTab('recycle');

    const typeLabels = {
        'prescription': 'Receta',
        'license': 'Licencia',
        'certificate': 'Certificado',
        'referral': 'Derivación'
    };

    if (loading) return <Loading variant="centered" text={t('loading')} />;

    const isAdminOrSecretary = ['admin', 'secretary'].includes(user.role);
    const canEdit = user.role === 'admin' || user.role === 'secretary' || user.role === 'doctor';

    const baseClass = 'requirements-list';

    return (
        <div className={baseClass}>
            <nav className={`${baseClass}__tabs`}>
                <TabButton
                    isActive={activeTab === 'list'}
                    onClick={handleListTab}
                    variant="pill"
                    icon={<Icon name="view_list" />}
                >
                    {t('request_status')}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'new'}
                    onClick={handleNewTab}
                    variant="pill"
                    icon={<Icon name="add_circle" />}
                >
                    {t('new_request')}
                </TabButton>
                {isAdminOrSecretary && canDeleteRequest && (
                    <div className={`${baseClass}__tab-wrapper`}>
                        <TabButton
                            isActive={activeTab === 'recycle'}
                            onClick={handleRecycleTab}
                            variant="pill"
                            icon={<Icon name="delete" />}
                        >
                            {t('recycle_bin') || 'Papelera'}
                        </TabButton>
                        {recycleRequests.length > 0 && (
                            <span className={`${baseClass}__badge`}>{recycleRequests.length}</span>
                        )}
                    </div>
                )}
            </nav>

            {activeTab === 'new' ? (
                <div className={`${baseClass}__content animate-fadeIn`}>
                    <MedicalRequestForm
                        doctors={doctors}
                        onRequestCreated={() => {
                            fetchRequests();
                            setActiveTab('list');
                        }}
                    />
                </div>
            ) : activeTab === 'list' ? (
                <div className={`${baseClass}__content animate-fadeIn`}>
                    <div className={`${baseClass}__filters`}>
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
                        <div className={`${baseClass}__empty`}>
                            <Icon name="inbox" size="3rem" />
                            <p>{t('no_requests') || (filter === 'active' ? 'No hay requerimientos pendientes.' : 'No hay historial.')}</p>
                            {filter === 'active' && (
                                <Button
                                    variant="primary"
                                    onClick={handleNewTab}
                                    icon={<Icon name="add_circle" />}
                                >
                                    {t('create_first_request') || 'Crear primera solicitud'}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className={`${baseClass}__table-container`}>
                            <table className={`${baseClass}__table`}>
                                <thead className={`${baseClass}__table-head`}>
                                    <tr className={`${baseClass}__table-row`}>
                                        <th className={`${baseClass}__table-header`}>{t('type') || 'Tipo'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('date') || 'Fecha'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('patient') || 'Paciente'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('doctor') || 'Doctor'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('requested_by') || 'Solicitado Por'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('status') || 'Estado'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('actions') || 'Acciones'}</th>
                                    </tr>
                                </thead>
                                <tbody className={`${baseClass}__table-body`}>
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
                <div className={`${baseClass}__content animate-fadeIn`}>
                    {recycleRequests.length === 0 ? (
                        <div className={`${baseClass}__empty`}>
                            <Icon name="delete_sweep" size="3rem" />
                            <p>{t('recycle_empty') || 'No hay elementos en la papelera.'}</p>
                        </div>
                    ) : (
                        <div className={`${baseClass}__table-container`}>
                            <table className={`${baseClass}__table`}>
                                <thead className={`${baseClass}__table-head`}>
                                    <tr className={`${baseClass}__table-row`}>
                                        <th className={`${baseClass}__table-header`}>{t('element') || 'Elemento'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('deleted_by') || 'Eliminado Por'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('delete_date') || 'Fecha Eliminación'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('expires') || 'Expira'}</th>
                                        <th className={`${baseClass}__table-header`}>{t('actions') || 'Acciones'}</th>
                                    </tr>
                                </thead>
                                <tbody className={`${baseClass}__table-body`}>
                                    {recycleRequests.map(item => (
                                        <tr key={item.id} className="requirement-item">
                                            <td className="requirement-item__cell requirement-item__patient-name">{item.entity_name}</td>
                                            <td className="requirement-item__cell">{item.deleted_by_name}</td>
                                            <td className="requirement-item__cell">{new Date(item.deleted_at).toLocaleString()}</td>
                                            <td className="requirement-item__cell">{new Date(item.expires_at).toLocaleDateString()}</td>
                                            <td className="requirement-item__cell">
                                                <div className="requirement-item__actions">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleRestore(item)}
                                                        icon={<Icon name="restore" size="1rem" />}
                                                    >
                                                        {t('restore') || 'Restaurar'}
                                                    </Button>
                                                </div>
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
                        <header className="requirements-detail__header">
                            <div className="requirements-detail__patient">
                                <span className="requirements-detail__patient-name">{selectedRequest.patient_name}</span>
                                <small className="requirements-detail__patient-dni">DNI: {selectedRequest.patient_dni}</small>
                            </div>
                            <div className="requirements-detail__doctor">
                                <Icon name="medical_services" size="1rem" />
                                <span>Dr. {selectedRequest.doctor_name}</span>
                            </div>
                        </header>

                        <div className="requirements-detail__info-bar">
                            <Badge variant={selectedRequest.type === 'prescription' ? 'blue' : 'green'}>
                                {typeLabels[selectedRequest.type] || selectedRequest.type}
                            </Badge>
                            {canEdit && !isEditing && (
                                <Button size="sm-compact" variant="secondary" onClick={handleOpenEdit} icon={<Icon name="edit" size="0.9rem" />}>
                                    {t('edit_list') || 'Editar Lista'}
                                </Button>
                            )}
                        </div>

                        <div className={`requirements-detail__body ${isEditing ? 'requirements-detail__body--editing' : ''}`}>
                            {isEditing ? (
                                <div className="requirements-edit">
                                    <h4 className="requirements-detail__section-title">
                                        <Icon name="edit_note" />
                                        {t('editing_medication') || 'Editando Medicación'}
                                    </h4>
                                    <MedicationEditor
                                        meds={editMeds}
                                        onMedChange={updateEditMed}
                                        onRemoveMed={(idx) => setEditMeds(prev => prev.filter((_, i) => i !== idx))}
                                        newMed={newMedInput}
                                        onNewMedChange={(field, val) => setNewMedInput(prev => ({ ...prev, [field]: val }))}
                                        onAddMed={handleAddMed}
                                        t={t}
                                    />
                                    <div className="requirements-detail__notes">
                                        <FormGroup label={t('request_note') || 'Nota del Paciente'}>
                                            <Input
                                                type="textarea"
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                rows={2}
                                            />
                                        </FormGroup>

                                        <FormGroup label={t('doctor_reply') || 'Respuesta del Doctor'}>
                                            <Input
                                                type="textarea"
                                                value={editDoctorNote}
                                                onChange={(e) => setEditDoctorNote(e.target.value)}
                                                rows={2}
                                                placeholder={t('doctor_note_placeholder') || "Añada una indicación o respuesta..."}
                                            />
                                        </FormGroup>
                                    </div>
                                    <div className="requirements-detail__actions">
                                        <Button variant="ghost" onClick={handleCancelEdit}>
                                            {t('cancel')}
                                        </Button>
                                        <Button variant="primary" onClick={handleSaveEdit} icon={<Icon name="save" />}>
                                            {t('save_changes')}
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
                                                    <h4 className="requirements-detail__section-title">
                                                        <Icon name="medication" />
                                                        {t('requested_medication') || 'Medicación Solicitada'}
                                                    </h4>

                                                    {unknownMeds.length > 0 && (
                                                        <section className="requirements-detail__group">
                                                            <h5 className="requirements-detail__group-title requirements-detail__group-title--unknown">
                                                                <Icon name="warning" size="1rem" />
                                                                {t('new_meds_warning') || 'Nuevos / No Habituales'}
                                                            </h5>
                                                            <div className="requirements-detail__grid">
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
                                                        </section>
                                                    )}

                                                    {knownMeds.length > 0 && (
                                                        <section className="requirements-detail__group">
                                                            <h5 className="requirements-detail__group-title requirements-detail__group-title--known">
                                                                <Icon name="verified" size="1rem" />
                                                                {t('habitual_meds') || 'Habituales (Validado)'}
                                                            </h5>
                                                            <div className="requirements-detail__grid">
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
                                                        </section>
                                                    )}
                                                </div>
                                            )}

                                            {notes && (
                                                <div className="requirements-detail__notes">
                                                    <strong className="requirements-detail__label">
                                                        <Icon name="notes" size="1rem" />
                                                        {meds.length > 0 ? t('additional_notes') : t('detail_reason')}:
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

                        {(selectedRequest.doctor_note || selectedRequest.secretary_note) && (
                            <div className="requirements-detail__feedback">
                                {selectedRequest.doctor_note && (
                                    <div className="requirements-detail__feedback-item">
                                        <strong>{t('doctor_note')}:</strong>
                                        <p>{selectedRequest.doctor_note}</p>
                                    </div>
                                )}
                                {selectedRequest.secretary_note && (
                                    <div className="requirements-detail__feedback-item">
                                        <strong>{t('secretary_reply')}:</strong>
                                        <p>{selectedRequest.secretary_note}</p>
                                    </div>
                                )}
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
                <div className="requirements-list__form-group">
                    <label className="requirements-list__form-label">
                        {actionModal.type === 'consult' ? t('your_question') :
                            (actionModal.type === 'reply' ? t('your_answer') : t('doctor_note'))}
                        {['rejected', 'consult', 'reply'].includes(actionModal.type) && <span className="text-danger">*</span>}
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

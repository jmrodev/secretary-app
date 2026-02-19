import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';
import FormGroup from '../molecules/FormGroup';
import MedicationEditor from '../molecules/MedicationEditor';
import { extractMedicationDetails } from '../../utils/medicationHelpers';

// Molecules
import RequirementDetailHeader from '../molecules/RequirementDetailHeader';
import RequirementMedicationList from '../molecules/RequirementMedicationList';
import RequirementFeedback from '../molecules/RequirementFeedback';

/**
 * RequirementDetailModal Organism.
 * Orchestrates the display and editing of medical request details, 
 * including patient/doctor info, medication lists, and feedback notes.
 */
const RequirementDetailModal = ({
    selectedRequest,
    onClose,
    t,
    canEdit,
    isEditing,
    handleOpenEdit,
    handleCancelEdit,
    handleSaveEdit,
    editMeds,
    updateEditMed,
    setEditMeds,
    newMedInput,
    setNewMedInput,
    handleAddMed,
    editNotes,
    setEditNotes,
    editDoctorNote,
    setEditDoctorNote,
    checkIsKnown,
    addToChronic,
    typeLabels
}) => {
    if (!selectedRequest) return null;

    return (
        <Modal
            isOpen={!!selectedRequest}
            onClose={onClose}
            title={t('request_detail') || "Detalle de Solicitud"}
        >
            <div className="requirements-detail">
                <RequirementDetailHeader selectedRequest={selectedRequest} />

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
                        <RequirementMedicationList
                            {...extractMedicationDetails(selectedRequest)}
                            checkIsKnown={checkIsKnown}
                            canEdit={canEdit}
                            addToChronic={addToChronic}
                            t={t}
                        />
                    )}
                </div>

                <RequirementFeedback
                    doctorNote={selectedRequest.doctor_note}
                    secretaryNote={selectedRequest.secretary_note}
                    t={t}
                />

                <div className="requirements-detail__footer">
                    <Button onClick={onClose} variant="secondary">
                        {t('close')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RequirementDetailModal;

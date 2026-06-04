import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import FormGroup from '@/components/molecules/FormGroup';
import MedicationEditor from '@/features/medical_documents/components/forms/MedicationEditor';
import { extractMedicationDetails } from '@/features/medical_documents/utils/medicationHelpers';

// Molecules
import RequirementDetailHeader from '@/features/medical_documents/components/sections/RequirementDetailHeader';
import RequirementMedicationList from '@/features/medical_documents/components/lists/RequirementMedicationList';
import RequirementFeedback from '@/features/medical_documents/components/sections/RequirementFeedback';

// Styles
import styles from './MedicalRequirementDetailModal.module.css';

/**
 * MedicalRequirementDetailModal Organism (Feature-based).
 * Orchestrates the display and editing of medical request details.
 */
const MedicalRequirementDetailModal = ({
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
            <div className={`${styles.root}`}>
                <RequirementDetailHeader selectedRequest={selectedRequest} />

                <div className={`${styles.infoBar}`}>
                    <Badge variant={selectedRequest.type === 'prescription' ? 'blue' : 'green'}>
                        {typeLabels[selectedRequest.type] || selectedRequest.type}
                    </Badge>
                    {canEdit && !isEditing && (
                        <Button size="sm-compact" variant="secondary" onClick={handleOpenEdit} icon={<Icon name="edit" size="0.9rem" />}>
                            {t('edit_list') || 'Editar Lista'}
                        </Button>
                    )}
                </div>

                <div className={`${styles.body} ${isEditing ? styles.bodyEditing : ''}`}>
                    {isEditing ? (
                        <div className={`${styles.requirementsEdit}`}>
                            <h4 className={`${styles.sectionTitle}`}>
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
                            <div className={`${styles.notes}`}>
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
                            <div className={`${styles.actions}`}>
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

                <div className={`${styles.footer}`}>
                    <Button onClick={onClose} variant="secondary">
                        {t('close')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default MedicalRequirementDetailModal;

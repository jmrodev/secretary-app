import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import PrescriptionItemsList from './PrescriptionItemsList';
import '../organisms/PrescriptionModal.css';

/**
 * EditRequestModal Molecule.
 * Modal for editing general medical requests and their replies.
 */
const EditRequestModal = ({
    isOpen,
    onClose,
    request,
    editData,
    onEditDataChange,
    onUpdate,
    t
}) => {
    if (!isOpen || !request) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('edit_request')}
            footer={
                editData._readOnly ? (
                    <Button variant="secondary" onClick={onClose}>{t('close') || 'Cerrar'}</Button>
                ) : (
                    <>
                        <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                        <Button onClick={onUpdate}>{t('save')}</Button>
                    </>
                )
            }
        >
            <div className="config-flex--column config-flex--gap-4">
                {request.type === 'prescription' && editData.items && editData.items.length > 0 && (
                    <div className="prescription-modal mb-4">
                        <PrescriptionItemsList
                            items={editData.items}
                            handleRemoveItem={() => { }} // Read-only in this simple edit/view modal
                            t={t}
                            readOnly={true}
                        />
                    </div>
                )}
                <div className="input-group">
                    <label className="input-label">{request.type === 'prescription' ? t('medications') || 'Medicamentos (Texto Original)' : t('request_note')}</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        readOnly={editData._readOnly}
                        value={editData.request_note || ''}
                        onChange={e => onEditDataChange('request_note', e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('doctor_reply')}</label>
                    <textarea
                        className="input-field"
                        rows="3"
                        readOnly={editData._readOnly}
                        value={editData.doctor_note || ''}
                        onChange={e => onEditDataChange('doctor_note', e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default EditRequestModal;

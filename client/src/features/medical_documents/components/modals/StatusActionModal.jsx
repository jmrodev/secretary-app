
import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';

/**
 * StatusActionModal Molecule.
 * Modal for approving or rejecting a request with an optional note.
 */
const StatusActionModal = ({
    isOpen,
    onClose,
    type,
    id,
    note,
    onNoteChange,
    onUpdateStatus,
    t
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'completed' ? t('approve_request') : t('reject_request')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={() => onUpdateStatus(id, type, note)}>
                        {type === 'completed' ? t('approve') : t('reject')}
                    </Button>
                </>
            }
        >
            <div className="input-group">
                <label className="input-label" htmlFor="status-note">
                    {type === 'completed' ? t('message_optional') : t('reason_rejection')}
                </label>
                <textarea
                    id="status-note"
                    className="input-field"
                    rows="3"
                    value={note}
                    onChange={e => onNoteChange(e.target.value)}
                />
            </div>
        </Modal>
    );
};

export default StatusActionModal;

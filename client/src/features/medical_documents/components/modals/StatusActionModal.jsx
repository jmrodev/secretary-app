
import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FormGroup } from '@/components/molecules/FormGroup';

/**
 * StatusActionModal Molecule.
 * Modal for approving or rejecting a request with an optional note.
 */
export const StatusActionModal = ({
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
            <FormGroup
                label={type === 'completed' ? t('message_optional') : t('reason_rejection')}
                htmlFor="status-note"
            >
                <Input
                    type="textarea"
                    id="status-note"
                    rows={3}
                    value={note}
                    onChange={e => onNoteChange(e.target.value)}
                />
            </FormGroup>
        </Modal>
    );
};


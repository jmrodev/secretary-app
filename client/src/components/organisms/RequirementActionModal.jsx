import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import Input from '../atoms/Input';

const RequirementActionModal = ({
    actionModal,
    onClose,
    t,
    confirmAction,
    actionNote,
    setActionNote
}) => {
    return (
        <Modal
            isOpen={actionModal.open}
            onClose={onClose}
            title={
                actionModal.type === 'completed' ? t('mark_as_done') :
                    (actionModal.type === 'rejected' ? t('reject_request') :
                        (actionModal.type === 'consult' ? t('consult_secretary') :
                            (actionModal.type === 'reply' ? t('reply_to_doctor') : 'Acción')))
            }
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
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
    );
};

export default RequirementActionModal;

import React, { useRef } from 'react';
import Button from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({
    isOpen,
    title,
    message,
    type = 'confirm',
    initialValue = '',
    onConfirm,
    onCancel,
    labels = {
        alert: 'Alert',
        confirm: 'Confirm',
        close: 'Close',
        cancel: 'Cancel',
        accept: 'Accept'
    }
}) => {
    const inputRef = useRef(null);

    React.useEffect(() => {
        if (isOpen && type === 'prompt' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, type]);

    if (!isOpen) return null;

    const handleConfirm = (e) => {
        if (e) e.preventDefault();
        onConfirm(type === 'prompt' ? (inputRef.current?.value ?? initialValue) : true);
    };

    const handleCancelClick = () => {
        onCancel();
    };

    const footer = (
        <>
            {type !== 'alert' && (
                <Button
                    variant="ghost"
                    onClick={handleCancelClick}
                >
                    {labels.cancel}
                </Button>
            )}
            <Button
                variant="primary"
                onClick={handleConfirm}
            >
                {labels.accept}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancelClick}
            title={title || (type === 'alert' ? labels.alert : labels.confirm)}
            footer={footer}
            size="md"
        >
            <div className={`${styles.text} ${type === 'prompt' ? styles.textPrompt : ''}`}>
                {message}
            </div>
            {type === 'prompt' && (
                <form onSubmit={handleConfirm} className="modal-form-bem">
                    <input
                        type="text"
                        className="input-field"
                        defaultValue={initialValue}
                        ref={inputRef}
                    />
                </form>
            )}
        </Modal>
    );
};

export default ConfirmModal;

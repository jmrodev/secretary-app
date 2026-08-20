import React, { useRef } from 'react';
import { Button } from '@/components/atoms/Button';
import { Modal } from '@/components/molecules/Modal';
import styles from './ConfirmModal.module.css';

export const ConfirmModal = ({
    isOpen,
    title,
    message,
    type = 'confirm',
    initialValue = '',
    inputType = 'text',
    onConfirm,
    onCancel,
    labels = {
        alert: 'Alert',
        confirm: 'Confirm',
        close: 'Close',
        cancel: 'Cancel',
        accept: 'Accept',
        prompt: 'Value'
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
            <div className={`${styles.ConfirmModal__text} ${type === 'prompt' ? styles.ConfirmModal__textPrompt : ''}`}>
                {message}
            </div>
            {type === 'prompt' && (
                <form onSubmit={handleConfirm} className="modal-form-bem">
                    <label htmlFor="confirm-modal-prompt-input" className={styles.ConfirmModal__label}>
                        {labels.prompt || 'Value'}
                    </label>
                    <input
                        id="confirm-modal-prompt-input"
                        type={inputType}
                        className="input-field"
                        defaultValue={initialValue}
                        ref={inputRef}
                    />
                </form>
            )}
        </Modal>
    );
};


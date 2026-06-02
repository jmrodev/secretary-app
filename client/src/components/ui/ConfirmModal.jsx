import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './ConfirmModal.css';

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

    return ReactDOM.createPortal(
        <div className="modal-overlay-bem">
            <div className="modal-content-bem animate-fade-in">
                <div className="modal-header-bem">
                    <h3 className="modal-header-bem__title">
                        {title || (type === 'alert' ? labels.alert : labels.confirm)}
                    </h3>
                    <Button
                        className="modal-header-bem__close"
                        onClick={handleCancelClick}
                        unstyled
                        icon={<Icon name="close" />}
                        aria-label={labels.close}
                    />
                </div>
                <div className="modal-body-bem">
                    <div className={`modal-body-bem__text ${type === 'prompt' ? 'modal-body-bem__text--prompt' : ''}`}>
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
                </div>
                <div className="modal-footer-bem">
                    {type !== 'alert' && (
                        <Button
                            className="btn-text btn-text--secondary"
                            onClick={handleCancelClick}
                            unstyled
                        >
                            {labels.cancel}
                        </Button>
                    )}
                    <Button
                        className="btn-base btn-base--primary"
                        onClick={handleConfirm}
                        unstyled
                    >
                        {labels.accept}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;

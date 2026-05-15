import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import './ConfirmModal.css';

const ConfirmModal = ({
    isOpen,
    title,
    message,
    type = 'confirm',
    initialValue = '',
    onConfirm,
    onCancel
}) => {
    const { t } = useLanguage();
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
                        {title || (type === 'alert' ? t('alert') : t('confirm'))}
                    </h3>
                    <Button
                        className="modal-header-bem__close"
                        onClick={handleCancelClick}
                        unstyled
                        icon={<Icon name="close" />}
                        aria-label={t('close')}
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
                            {t('cancel')}
                        </Button>
                    )}
                    <Button
                        className="btn-base btn-base--primary"
                        onClick={handleConfirm}
                        unstyled
                    >
                        {t('accept')}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;

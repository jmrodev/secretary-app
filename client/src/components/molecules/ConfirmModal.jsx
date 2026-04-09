import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLanguage } from '@/context/LanguageContext';
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
    const [inputValue, setInputValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleConfirm = (e) => {
        if (e) e.preventDefault();
        onConfirm(type === 'prompt' ? inputValue : true);
    };

    const handleCancelClick = () => {
        onCancel();
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay-bem">
            <div className="modal-content-bem animate-fadeIn">
                <div className="modal-header-bem">
                    <h3 className="modal-header-bem__title">
                        {title || (type === 'alert' ? t('alert') : t('confirm'))}
                    </h3>
                    <button
                        className="modal-header-bem__close"
                        onClick={handleCancelClick}
                    >&times;</button>
                </div>
                <div className="modal-body-bem">
                    <div className={`modal-body-bem__text ${type === 'prompt' ? 'modal-body-bem__text--prompt' : ''}`}>
                        {message}
                    </div>
                    {type === 'prompt' && (
                        <form onSubmit={handleConfirm} className="modal-form-bem">
                            <input
                                autoFocus
                                type="text"
                                className="input-field"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </form>
                    )}
                </div>
                <div className="modal-footer-bem">
                    {type !== 'alert' && (
                        <button
                            className="btn-text btn-text--secondary"
                            onClick={handleCancelClick}
                        >
                            {t('cancel')}
                        </button>
                    )}
                    <button
                        className="btn-base btn-base--primary"
                        onClick={handleConfirm}
                    >
                        {t('accept')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';

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

    return ReactDOM.createPortal(
        <div className="modal-overlay-bem" style={{ zIndex: 100000 }}>
            <div className="modal-content-bem animate-fadeIn" style={{ maxWidth: '400px' }}>
                <div className="modal-header-bem">
                    <h3 className="modal-header-bem__title">
                        {title || (type === 'alert' ? t('alert') : t('confirm'))}
                    </h3>
                    <button className="modal-header-bem__close" onClick={() => onCancel()}>&times;</button>
                </div>
                <div className="modal-body-bem">
                    <p className="modal-body-bem__text" style={{ whiteSpace: 'pre-wrap', marginBottom: type === 'prompt' ? '1rem' : '0' }}>
                        {message}
                    </p>
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
                <div className="modal-footer-bem modal-footer-bem--right">
                    {type !== 'alert' && (
                        <button className="btn-text btn-text--secondary" onClick={() => onCancel()}>
                            {t('cancel')}
                        </button>
                    )}
                    <button className="btn-base btn-base--primary" onClick={handleConfirm}>
                        {t('accept')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;

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

    const handleCancelClick = () => {
        onCancel();
    };

    return ReactDOM.createPortal(
        <div
            className="modal-overlay-bem"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100000
            }}
        >
            <div
                className="modal-content-bem animate-fadeIn"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    animation: 'fadeIn 0.2s ease-in-out'
                }}
            >
                <div className="modal-header-bem" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="modal-header-bem__title" style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {title || (type === 'alert' ? t('alert') : t('confirm'))}
                    </h3>
                    <button
                        className="modal-header-bem__close"
                        onClick={handleCancelClick}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '0 8px',
                            lineHeight: 1
                        }}
                    >&times;</button>
                </div>
                <div className="modal-body-bem" style={{ marginBottom: '20px' }}>
                    <p className="modal-body-bem__text" style={{ whiteSpace: 'pre-wrap', marginBottom: type === 'prompt' ? '1rem' : '0', fontSize: '14px', lineHeight: '1.5' }}>
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
                <div className="modal-footer-bem modal-footer-bem--right" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {type !== 'alert' && (
                        <button
                            className="btn-text btn-text--secondary"
                            onClick={handleCancelClick}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {t('cancel')}
                        </button>
                    )}
                    <button
                        className="btn-base btn-base--primary"
                        onClick={handleConfirm}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#3b82f6',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
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

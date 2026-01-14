import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

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

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3>{title || (type === 'alert' ? t('alert') : t('confirm'))}</h3>
                    <button className="modal-close" onClick={() => onCancel()}>&times;</button>
                </div>
                <div className="modal-body">
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: type === 'prompt' ? '1rem' : '0' }}>
                        {message}
                    </p>
                    {type === 'prompt' && (
                        <form onSubmit={handleConfirm}>
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
                <div className="modal-footer">
                    {type !== 'alert' && (
                        <button className="btn btn-secondary" onClick={() => onCancel()}>
                            {t('cancel') || 'Cancelar'}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={handleConfirm}>
                        {t('accept') || 'Aceptar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;

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
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
            <div className="modal-content animate-fadeIn" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3 className="font-bold text-lg">{title || (type === 'alert' ? t('alert') : t('confirm'))}</h3>
                    <button className="modal-close text-2xl" onClick={() => onCancel()}>&times;</button>
                </div>
                <div className="modal-body py-4">
                    <p className="text-gray-700 leading-relaxed" style={{ whiteSpace: 'pre-wrap', marginBottom: type === 'prompt' ? '1rem' : '0' }}>
                        {message}
                    </p>
                    {type === 'prompt' && (
                        <form onSubmit={handleConfirm} className="mt-4">
                            <input
                                autoFocus
                                type="text"
                                className="input-field border-blue-200 focus:border-blue-500 transition-all"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </form>
                    )}
                </div>
                <div className="modal-footer flex justify-end gap-2 pt-4 border-t border-gray-100">
                    {type !== 'alert' && (
                        <button className="btn btn-secondary px-6 py-2" onClick={() => onCancel()}>
                            {t('cancel') || 'Cancelar'}
                        </button>
                    )}
                    <button className="btn btn-primary px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold shadow-md" onClick={handleConfirm}>
                        {t('accept') || 'Aceptar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;

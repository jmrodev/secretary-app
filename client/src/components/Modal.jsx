import React from 'react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${size === 'lg' ? 'modal-lg' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {children}
                </div>

                <div className="modal-footer">
                    {footer}
                </div>
            </div>
        </div>
    );
};

export default Modal;

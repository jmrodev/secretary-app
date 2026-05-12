import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', variant = 'light', className = '' }) => {
    // Prevent scrolling on body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
    };

    return ReactDOM.createPortal(
        <div 
            className="modal" 
            onClick={onClose} 
            onKeyDown={handleKeyDown}
            role="presentation"
        >
            <div
                className={`modal__content ${size && size !== 'md' ? `modal__content--${size}` : ''} ${className}`}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
            >
                <header className="modal__header">
                    <h3 id="modal-title" className="modal__title">{title}</h3>
                    <Button
                        variant="ghost"
                        size="md-compact"
                        className="modal__close"
                        onClick={onClose}
                        aria-label="Close"
                        icon={<Icon name="CLOSE" />}
                    />
                </header>

                <div className="modal__body">
                    {children}
                </div>

                {footer && (
                    <footer className="modal__footer">
                        {footer}
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;

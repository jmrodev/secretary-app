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

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-content ${size && size !== 'md' ? `modal-content--${size}` : ''} ${variant === 'dark' ? 'modal-content--dark' : ''} ${className}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="modal-header">
                    <h3 className="modal-header__title">{title}</h3>
                    <Button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close"
                        unstyled
                        icon={<Icon name="close" />}
                    />
                </header>

                <div className="modal-body">
                    {children}
                </div>

                {footer && (
                    <footer className="modal-footer">
                        {footer}
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;

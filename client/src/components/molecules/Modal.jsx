import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', variant = 'light', className = '' }) => {
    // Prevent scrolling on body when modal is open and handle global Escape key
    const onCloseRef = React.useRef(onClose);
    
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    // Prevent scrolling on body when modal is open and handle global Escape key
    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = 'hidden';
        const handleKeyDownGlobal = (e) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        window.addEventListener('keydown', handleKeyDownGlobal);
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDownGlobal);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal">
            <button
                type="button"
                className="modal__backdrop"
                onClick={onClose}
                aria-label="Cerrar modal"
            />
            <div
                className={`modal__content ${size && size !== 'md' ? `modal__content--${size}` : ''} ${className}`}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
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

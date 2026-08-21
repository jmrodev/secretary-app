import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './Modal.module.css';

export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', variant: _variant = 'light', className = '' }) => {
    const { t } = useLanguage();

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
        <div className={`${styles.Modal__root}`}>
            <button
                type="button"
                className={`${styles.Modal__backdrop}`}
                onClick={onClose}
                aria-label={t('modal_close')}
            />
            <div
                className={`${styles.Modal__content} ${size && size !== 'md' ? styles['content' + size.charAt(0).toUpperCase() + size.slice(1)] : ''} ${className}`}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
            >
                <header className={`${styles.Modal__header}`}>
                    <h3 id="modal-title" className={`${styles.Modal__title}`}>{title}</h3>
                    <Button
                        variant="ghost"
                        size="md-compact"
                        className={`${styles.Modal__close}`}
                        onClick={onClose}
                        aria-label={t('modal_close')}
                        icon={<Icon name="CLOSE" />}
                        unstyled
                    />
                </header>

                <div className={`${styles.Modal__body}`}>
                    {children}
                </div>

                {footer && (
                    <footer className={`${styles.Modal__footer}`}>
                        {footer}
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
};


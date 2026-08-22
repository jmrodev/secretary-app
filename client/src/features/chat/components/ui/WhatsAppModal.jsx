import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { FormGroup } from '@/components/molecules/FormGroup';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import { api } from '@/api/axios';
import styles from './WhatsAppModal.module.css';

/**
 * WhatsAppModal Feature Molecule.
 * Facilitates sending direct WhatsApp messages to patients.
 * Handles phone normalization (Argentinian format) and message encoding/clipboard copy.
 */
export const WhatsAppModal = ({ isOpen, onClose, phone, message, onMessageChange }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const handleSend = () => {
        const safePhone = String(phone || '');
        let cleanPhone = safePhone.replace(/\D/g, '');

        if (!cleanPhone.startsWith('54') && cleanPhone.length >= 10) {
            cleanPhone = '549' + cleanPhone;
        }

        const encodedText = encodeURIComponent(message || '');

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(message || '').catch(err => console.error("Clipboard error:", err));
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            window.location.href = `https://wa.me/${cleanPhone}?text=${encodedText}`;
        } else {
            const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
            const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
            window.location.href = appUrl;
            setTimeout(() => {
                if (document.hasFocus()) {
                    window.open(webUrl, '_blank');
                }
            }, 1000);
        }

        onClose();
        showMessage(t('message_copied_opening_wa'), "success");
    };

    const handleAutoSend = async () => {
        const safePhone = String(phone || '');
        let cleanPhone = safePhone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('54') && cleanPhone.length >= 10) cleanPhone = '549' + cleanPhone;

        try {
            showMessage(t('sending_via_bridge'), "info");
            await api.post('/whatsapp/send-direct', { to: cleanPhone, message });
            showMessage(t('sent_via_bridge_success'), "success");
            onClose();
        } catch (err) {
            console.error("Bridge send failed:", err);
            showMessage(t('bridge_failed_fallback'), "error");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className={`${styles.WhatsAppModal__title}`}>
                    <Icon name="chat" size="1.2rem" />
                    {t('whatsapp_confirmation')}
                </div>
            }
            footer={
                <div className={`${styles.WhatsAppModal__footer}`}>
                    <Button variant="ghost" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="accent"
                        className={`${styles.WhatsAppModal__sendBtn}`}
                        onClick={handleAutoSend}
                    >
                        <Icon name="bolt" size="1.1rem" />
                        {t('send_automatically')}
                    </Button>
                    <Button
                        variant="primary"
                        className={`${styles.WhatsAppModal__sendBtn}`}
                        onClick={handleSend}
                    >
                        {t('send_via_whatsapp')}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.WhatsAppModal__root} animate-fade-in`}>
                <div className={`${styles.WhatsAppModal__info}`}>
                    <div className={`${styles.WhatsAppModal__icon}`}>
                        <Icon name="smartphone" size="1.2rem" />
                    </div>
                    <div>
                        <p className={`${styles.WhatsAppModal__recipient}`}>{t('sending_to')}: {phone}</p>
                        <p className={`${styles.WhatsAppModal__help}`}>{t('wa_help_text')}</p>
                    </div>
                </div>

                <FormGroup label={t('message_to_send')}>
                    <textarea
                        className={`${styles.WhatsAppModal__textarea}`}
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

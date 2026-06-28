import React from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import FormGroup from '@/components/molecules/FormGroup';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import api from '@/api/axios';
import styles from './WhatsAppModal.module.css';

/**
 * WhatsAppModal Feature Molecule.
 * Facilitates sending direct WhatsApp messages to patients.
 * Handles phone normalization (Argentinian format) and message encoding/clipboard copy.
 */
const WhatsAppModal = ({ isOpen, onClose, phone, message, onMessageChange }) => {
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
        showMessage(t('message_copied_opening_wa') || "Mensaje copiado. Intentando abrir WhatsApp...", "success");
    };

    const handleAutoSend = async () => {
        const safePhone = String(phone || '');
        let cleanPhone = safePhone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('54') && cleanPhone.length >= 10) cleanPhone = '549' + cleanPhone;

        try {
            showMessage(t('sending_via_bridge') || "Enviando por puente local...", "info");
            await api.post('/whatsapp/send-direct', { to: cleanPhone, message });
            showMessage(t('sent_via_bridge_success') || "Mensaje enviado automáticamente", "success");
            onClose();
        } catch (err) {
            console.error("Bridge send failed:", err);
            showMessage(t('bridge_failed_fallback') || "Error en el puente. Usá el modo manual.", "error");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className={`${styles.title}`}>
                    <Icon name="chat" size="1.2rem" />
                    {t('whatsapp_confirmation') || "Confirmación por WhatsApp"}
                </div>
            }
            footer={
                <div className={`${styles.footer}`}>
                    <Button variant="ghost" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="accent"
                        className={`${styles.sendBtn}`}
                        onClick={handleAutoSend}
                    >
                        <Icon name="bolt" size="1.1rem" className="mr-1" />
                        {t('send_automatically') || 'Envío Automático'}
                    </Button>
                    <Button
                        variant="primary"
                        className={`${styles.sendBtn}`}
                        onClick={handleSend}
                    >
                        {t('send_via_whatsapp') || 'Enviar Manual (Copiar)'}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.root} animate-fade-in`}>
                <div className={`${styles.info}`}>
                    <div className={`${styles.icon}`}>
                        <Icon name="smartphone" size="1.2rem" />
                    </div>
                    <div>
                        <p className={`${styles.recipient}`}>{t('sending_to') || 'Enviar a'}: {phone}</p>
                        <p className={`${styles.help}`}>{t('wa_help_text') || 'El mensaje se abrirá en WhatsApp Desktop/Web.'}</p>
                    </div>
                </div>

                <FormGroup label={t('message_to_send') || "Mensaje a enviar"}>
                    <textarea
                        className={`${styles.textarea}`}
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export default WhatsAppModal;

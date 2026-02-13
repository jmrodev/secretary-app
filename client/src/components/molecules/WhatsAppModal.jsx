import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import FormGroup from './FormGroup';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';
import './WhatsAppModal.css';

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
                window.open(webUrl, '_blank');
            }, 1000);
        }

        onClose();
        showMessage(t('message_copied_opening_wa') || "Mensaje copiado. Intentando abrir WhatsApp...", "success");
    };

    const baseClass = 'whatsapp-modal';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('whatsapp_confirmation') || "Confirmación por WhatsApp"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button
                        variant="accent"
                        className="text-white"
                        style={{ backgroundColor: '#10b981' }}
                        onClick={handleSend}
                    >
                        📲 {t('send_via_whatsapp') || 'Enviar por WhatsApp'}
                    </Button>
                </>
            }
        >
            <div className={baseClass}>
                <div className={`${baseClass}__info`}>
                    <div className={`${baseClass}__icon`}>📱</div>
                    <div>
                        <p className={`${baseClass}__recipient`}>{t('sending_to') || 'Enviar a'}: {phone}</p>
                        <p className={`${baseClass}__help`}>{t('wa_help_text') || 'El mensaje se abrirá en WhatsApp Desktop/Web.'}</p>
                    </div>
                </div>

                <FormGroup label={t('message_to_send') || "Mensaje a enviar"}>
                    <textarea
                        className={`input-field ${baseClass}__textarea`}
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                    ></textarea>
                </FormGroup>
            </div>
        </Modal>
    );
};

export default WhatsAppModal;

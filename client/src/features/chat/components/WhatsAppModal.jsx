import React from 'react';
import Modal from '../../../components/molecules/Modal';
import Button from '../../../components/atoms/Button';
import FormGroup from '../../../components/molecules/FormGroup';
import { useLanguage } from '../../../context/LanguageContext';
import { useMessage } from '../../../context/MessageContext';
import './WhatsAppModal.css';

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
            title={
                <div className="flex items-center gap-2 text-green-600 font-bold">
                    📲 {t('whatsapp_confirmation') || "Confirmación por WhatsApp"}
                </div>
            }
            footer={
                <div className="flex justify-end gap-3 w-full border-t border-gray-50 pt-4 mt-2">
                    <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-gray-600 uppercase tracking-widest text-[10px] font-bold">
                        {t('cancel')}
                    </Button>
                    <Button
                        variant="accent"
                        className="text-white shadow-lg shadow-green-200 uppercase tracking-widest text-[10px] font-bold"
                        style={{ backgroundColor: '#10b981' }}
                        onClick={handleSend}
                    >
                        {t('send_via_whatsapp') || 'Enviar por WhatsApp'}
                    </Button>
                </div>
            }
        >
            <div className={`${baseClass} animate-fadeIn p-2`}>
                <div className={`${baseClass}__info bg-green-50 p-4 border border-green-100 rounded-sm mb-6 flex gap-4 items-start`}>
                    <div className={`${baseClass}__icon text-2xl`}>📱</div>
                    <div>
                        <p className={`${baseClass}__recipient font-bold text-green-800 text-sm`}>{t('sending_to') || 'Enviar a'}: {phone}</p>
                        <p className={`${baseClass}__help text-[10px] text-green-600 uppercase tracking-tight font-medium mt-1`}>{t('wa_help_text') || 'El mensaje se abrirá en WhatsApp Desktop/Web.'}</p>
                    </div>
                </div>

                <FormGroup label={t('message_to_send') || "Mensaje a enviar"} className="mb-0">
                    <textarea
                        className="input-field border-gray-200 focus:border-green-500 w-full min-h-[120px] p-3 text-sm resize-none rounded-sm bg-slate-50 font-medium"
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                    ></textarea>
                </FormGroup>
            </div>
        </Modal>
    );
};

export default WhatsAppModal;

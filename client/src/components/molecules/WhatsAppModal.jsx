import React from 'react';
import Modal from './Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';

const WhatsAppModal = ({ isOpen, onClose, phone, message, onMessageChange }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const handleSend = () => {
        let cleanPhone = phone.replace(/\D/g, '');

        // Standardize AR phones if needed
        if (!cleanPhone.startsWith('54') && cleanPhone.length >= 10) {
            cleanPhone = '549' + cleanPhone;
        }

        const encodedText = encodeURIComponent(message);

        // Copy to clipboard for safety
        navigator.clipboard.writeText(message).catch(err => console.error(err));

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            window.location.href = `https://wa.me/${cleanPhone}?text=${encodedText}`;
        } else {
            const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
            const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

            window.location.href = appUrl;
            setTimeout(() => {
                window.open(webUrl, '_blank');
            }, 2500);
        }

        onClose();
        showMessage("Mensaje copiado. Abriendo WhatsApp...", "success");
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Sugerencia de WhatsApp"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
                    <button
                        className="btn btn-emerald text-white"
                        onClick={handleSend}
                    >
                        📲 Enviar Mensaje (ZapZap)
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">📱</div>
                    <div>
                        <p className="text-sm text-emerald-900 font-bold">Enviar a: {phone}</p>
                        <p className="text-xs text-emerald-700">El mensaje se abrirá en WhatsApp Desktop/Web.</p>
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Mensaje a enviar</label>
                    <textarea
                        className="input-field min-h-[120px]"
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                    ></textarea>
                </div>
            </div>
        </Modal>
    );
};

export default WhatsAppModal;

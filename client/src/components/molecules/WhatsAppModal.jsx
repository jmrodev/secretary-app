import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useMessage } from '../../context/MessageContext';

const WhatsAppModal = ({ isOpen, onClose, phone, message, onMessageChange }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();

    const handleSend = () => {
        const safePhone = String(phone || '');
        let cleanPhone = safePhone.replace(/\D/g, '');

        console.log("Sending WhatsApp:", { phone, cleanPhone, message });

        // Standardize AR phones if needed
        if (!cleanPhone.startsWith('54') && cleanPhone.length >= 10) {
            cleanPhone = '549' + cleanPhone;
        }

        const encodedText = encodeURIComponent(message || '');

        // Copy to clipboard for safety
        navigator.clipboard.writeText(message || '').catch(err => console.error("Clipboard error:", err));

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            window.location.href = `https://wa.me/${cleanPhone}?text=${encodedText}`;
        } else {
            // Desktop Strategy
            const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
            const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

            console.log("Opening URLs:", { appUrl, webUrl });

            // Try opening App, fall back to Web
            // Using window.open for success feedback

            window.location.href = appUrl;

            setTimeout(() => {
                window.open(webUrl, '_blank');
            }, 1000);
        }

        onClose();
        showMessage("Mensaje copiado. Intentando abrir WhatsApp...", "success");
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirmación por WhatsApp"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button
                        variant="accent"
                        className="btn-emerald text-white"
                        onClick={handleSend}
                    >
                        📲 Enviar por WhatsApp
                    </Button>
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

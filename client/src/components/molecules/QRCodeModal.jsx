import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { copyToClipboard } from '../../utils/clipboardUtils';

const QRCodeModal = ({ isOpen, onClose, url, expiresAt, patientName, patientPhone }) => {
    const { t } = useLanguage();
    const { alert } = useModal();

    const handlePrint = () => {
        // ... existing code ...
    };

    const handleCopy = () => {
        copyToClipboard(url).then(() => {
            alert("¡Enlace copiado al portapapeles!");
        }).catch(err => console.error(err));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="QR Acceso Paciente"
            size="sm"
            footer={
                <div className="flex gap-2 justify-end w-full">
                    <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
                    {patientPhone && (
                        <a
                            href={`https://wa.me/${patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${patientName}, por favor ingresa al siguiente enlace para completar tus datos: ${url}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success"
                            style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: 'white' }}
                        >
                            📱 WhatsApp
                        </a>
                    )}
                    <button className="btn btn-accent" onClick={handleCopy}>📋 {t('copy_link') || 'Copiar Enlace'}</button>
                    <button className="btn btn-primary" onClick={handlePrint}>🖨️ {t('print')}</button>
                </div>
            }
        >
            <div className="flex flex-col items-center justify-center p-4">
                <p className="text-center text-main-600 mb-4">
                    Muestra este código al paciente para que complete sus datos.
                </p>
                <div className="p-4 bg-white rounded border" id="qr-wrapper">
                    <QRCodeSVG
                        id="qr-code-svg"
                        value={url}
                        size={200}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>
                {expiresAt && (
                    <p className="text-xs text-main-500 mt-2">
                        Expira: {new Date(expiresAt).toLocaleTimeString()}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default QRCodeModal;

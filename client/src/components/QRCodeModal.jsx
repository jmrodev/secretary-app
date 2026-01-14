import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';

const QRCodeModal = ({ isOpen, onClose, url, expiresAt }) => {
    const { t } = useLanguage();
    const { alert } = useModal();

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Patient Access QR</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 2rem; }
                        .qr-container { margin-top: 2rem; }
                        h2 { margin-bottom: 0.5rem; }
                        .expiry { color: #666; font-size: 0.9rem; }
                    </style>
                </head>
                <body>
                    <h2>Escanea para completar tus datos</h2>
                    <p>Por favor, escanea este código con tu celular.</p>
                    <div class="qr-container">
                        ${document.getElementById('qr-code-svg').outerHTML}
                    </div>
                    <p class="expiry">Válido hasta: ${new Date(expiresAt).toLocaleTimeString()}</p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        alert("¡Enlace copiado al portapapeles!");
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
                    <button className="btn btn-accent" onClick={handleCopy}>📋 {t('copy_link') || 'Copiar Enlace'}</button>
                    <button className="btn btn-primary" onClick={handlePrint}>🖨️ {t('print')}</button>
                </div>
            }
        >
            <div className="flex flex-col items-center justify-center p-4">
                <p className="text-center text-slate-600 mb-4">
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
                    <p className="text-xs text-slate-500 mt-2">
                        Expira: {new Date(expiresAt).toLocaleTimeString()}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default QRCodeModal;

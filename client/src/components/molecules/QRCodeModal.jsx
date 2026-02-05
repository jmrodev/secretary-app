import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { useConfig } from '../../context/ConfigContext';
import { copyToClipboard } from '../../utils/clipboardUtils';

const QRCodeModal = ({ isOpen, onClose, url, expiresAt, patientName, patientPhone, type }) => {
    const { t } = useLanguage();
    const { alert } = useModal();
    const { settings } = useConfig();

    const isPrescription = type === 'prescription';
    const title = isPrescription ? "Solicitud de Receta" : "QR Acceso Paciente";

    // Dynamic message from settings or fallback
    const template = isPrescription
        ? (settings?.whatsapp_prescription_request_template || "Hola {patient_name}, por favor ingresa al siguiente enlace para solicitar tus recetas: {link}")
        : (settings?.whatsapp_patient_data_request_template || "Hola {patient_name}, por favor ingresa al siguiente enlace para completar tus datos: {link}");

    const waMessage = template
        .replace(/{patient_name}/g, patientName || '')
        .replace(/{link}/g, url);

    const handlePrint = () => {
        // ... (keeping existing print logic if it were here)
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
            title={title}
            size="sm"
            footer={
                <div className="flex gap-2 justify-end w-full">
                    <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
                    {patientPhone && (
                        <a
                            href={`https://wa.me/${patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success"
                            style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: 'white' }}
                        >
                            📱 WhatsApp
                        </a>
                    )}
                    <button className="btn btn-accent" onClick={handleCopy}>📋 {t('copy_link') || 'Copiar Enlace'}</button>
                </div>
            }
        >
            <div className="flex flex-col items-center justify-center p-4">
                <p className="text-center text-main-600 mb-4">
                    {isPrescription
                        ? "Envía este link al paciente para que solicite sus medicamentos."
                        : "Muestra este código al paciente para que complete sus datos."}
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

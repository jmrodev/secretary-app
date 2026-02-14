import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { useConfig } from '../../context/ConfigContext';
import { copyToClipboard } from '../../utils/clipboardUtils';

import './QRCodeModal.css';

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
                <div className="qr-modal-footer">
                    <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
                    {patientPhone && (
                        <a
                            href={`https://wa.me/${patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="qr-modal-footer__whatsapp"
                        >
                            <Icon name="smartphone" size="1.1rem" />
                            WhatsApp
                        </a>
                    )}
                    <Button variant="accent" onClick={handleCopy} icon={<Icon name="content_copy" size="1.1rem" />}>{t('copy_link') || 'Copiar Enlace'}</Button>
                </div>
            }
        >
            <div className="qr-modal-content">
                <p className="qr-modal-content__text">
                    {isPrescription
                        ? "Envía este link al paciente para que solicite sus medicamentos."
                        : "Muestra este código al paciente para que complete sus datos."}
                </p>
                <div className="qr-modal-content__wrapper" id="qr-wrapper">
                    <QRCodeSVG
                        id="qr-code-svg"
                        value={url}
                        size={200}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>
                {expiresAt && (
                    <p className="qr-modal-content__expiry">
                        Expira: {new Date(expiresAt).toLocaleTimeString()}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default QRCodeModal;

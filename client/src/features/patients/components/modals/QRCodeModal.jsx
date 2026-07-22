import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';
import { copyToClipboard } from '@/utils/core/clipboardUtils';
import { formatTime } from '@/utils/core/dateUtils';

import styles from './QRCodeModal.module.css';

const QRCodeModal = ({ isOpen, onClose, url, expiresAt, patientName, patientPhone, type }) => {
    const { t } = useLanguage();
    const { alert } = useModal();
    const { settings } = useConfig();

    const isPrescription = type === 'prescription';
    const title = isPrescription ? t('prescription_request_title') : t('qr_code_title');

    // Dynamic message from settings or fallback
    const template = isPrescription
        ? (settings?.whatsapp_prescription_request_template || t('placeholder_prescription_req'))
        : (settings?.whatsapp_patient_data_request_template || t('placeholder_data_req'));

    const waMessage = template
        .replace(/{patient_name}/g, patientName || '')
        .replace(/{link}/g, url);

    const handleCopy = () => {
        copyToClipboard(url).then(() => {
            alert(t('link_copied') || "¡Enlace copiado!");
        }).catch(err => console.error(err));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className={`${styles.qrModalFooter}`}>
                    <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
                    {patientPhone && (
                        <a
                            href={`https://wa.me/${patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.whatsapp}`}
                        >
                            <Icon name="smartphone" size="1.1rem" />
                            WhatsApp
                        </a>
                    )}
                    <Button variant="accent" onClick={handleCopy} icon={<Icon name="content_copy" size="1.1rem" />}>{t('copy_link') || 'Copiar Enlace'}</Button>
                </div>
            }
        >
            <div className={`${styles.root}`}>
                <p className={`${styles.text}`}>
                    {isPrescription
                        ? t('send_link_instruction')
                        : t('show_qr_instruction')}
                </p>
                <div className={`${styles.wrapper}`} id="qr-wrapper">
                    <QRCodeSVG
                        id="qr-code-svg"
                        value={url}
                        size={200}
                        level={"H"}
                        bgColor={"#FFFFFF"}
                        fgColor={"#000000"}
                        includeMargin={true}
                    />
                </div>
                {expiresAt && (
                    <p className={`${styles.expiry}`} suppressHydrationWarning>
                        {t('expires_label')}: {formatTime(expiresAt)}
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default QRCodeModal;

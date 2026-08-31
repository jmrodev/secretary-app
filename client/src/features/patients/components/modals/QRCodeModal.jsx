import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useMessage } from '@/context/MessageContext';
import { useConfig } from '@/context/ConfigContext';
import { copyToClipboard } from '@/utils/core/clipboardUtils';
import { formatTime } from '@/utils/core/dateUtils';

import styles from './QRCodeModal.module.css';

export const QRCodeModal = ({ isOpen, onClose, url, expiresAt, patientName, patientPhone, type }) => {
    const { t } = useLanguage();
    const { showMessage } = useMessage();
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
            showMessage(t('link_copied'), 'success');
        }).catch(err => console.error(err));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className={`${styles.QRCodeModal__qrModalFooter}`}>
                    <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
                    {patientPhone && (
                        <a
                            href={`https://wa.me/${patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.QRCodeModal__whatsapp}`}
                        >
                            <Icon name="smartphone" size="1.1rem" />
                            {t('whatsapp')}
                        </a>
                    )}
                    <Button variant="accent" onClick={handleCopy} icon={<Icon name="content_copy" size="1.1rem" />}>{t('copy_link')}</Button>
                </div>
            }
        >
            <div className={`${styles.QRCodeModal__root}`}>
                <p className={`${styles.QRCodeModal__text}`}>
                    {isPrescription
                        ? t('send_link_instruction')
                        : t('show_qr_instruction')}
                </p>
                <div className={`${styles.QRCodeModal__wrapper}`} id="qr-wrapper">
                    <QRCodeSVG
                        id="qr-code-svg"
                        value={url}
                        size={200}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>
                {expiresAt && (
                    <p className={`${styles.QRCodeModal__expiry}`} suppressHydrationWarning>
                        {t('expires_label')}: {formatTime(expiresAt)}
                    </p>
                )}
            </div>
        </Modal>
    );
};


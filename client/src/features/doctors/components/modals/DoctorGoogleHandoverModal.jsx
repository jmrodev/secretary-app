import React, { useState } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { QRCodeSVG } from 'qrcode.react';
import styles from '../sections/DoctorGoogleHandoverModal.module.css';

export const DoctorGoogleHandoverModal = ({ isOpen, onClose, authUrl, doctorPhone }) => {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(authUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Hola, por favor ingresá a este enlace para conectar tu cuenta de Google con el sistema de turnos: \n\n${authUrl}`);
        const phone = doctorPhone ? doctorPhone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('handover_title')}
            size="md"
        >
            <div className={styles.DoctorGoogleHandoverModal__content}>
                <p className={styles.DoctorGoogleHandoverModal__instruction}>
                    {t('handover_instructions')}
                </p>
                
                {authUrl ? (
                    <div className={styles.DoctorGoogleHandoverModal__qrContainer}>
                        <QRCodeSVG value={authUrl} size={200} />
                    </div>
                ) : (
                    <p>{t('loading_link')}</p>
                )}

                <div className={styles.DoctorGoogleHandoverModal__actions}>
                    <Button 
                        variant="success" 
                        size="md" 
                        icon={<Icon name="chat" />}
                        onClick={handleWhatsApp}
                    >
                        {t('send_whatsapp')}
                    </Button>
                    
                    <div className={styles.DoctorGoogleHandoverModal__urlBox}>
                        <span>{authUrl}</span>
                        <button onClick={handleCopy} className={styles.DoctorGoogleHandoverModal__copyBtn} title={copied ? t('link_copied') : t('copy_link')}>
                            <Icon name={copied ? "check" : "content_copy"} size="1.2rem" />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

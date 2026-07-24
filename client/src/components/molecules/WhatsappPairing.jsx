import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import styles from '../organisms/GlobalWhatsappMessenger.module.css';

/**
 * WhatsappPairing Molecule.
 * Renders the QR code or offline status for WhatsApp bridge pairing.
 */
const WhatsappPairing = ({ bridgeStatus, onRefresh, statusLoading, t }) => {
    const isOffline = bridgeStatus.status === 'offline';

    return (
        <div className={styles.pairing}>
            <div className={`${styles.pairingCard} ${styles.animateFadeIn}`}>

                <div className={styles.pairingIconWrapper}>
                    <div className={`${styles.pairingIcon} ${isOffline ? styles.pairingIconOffline : ''}`}>
                        <Icon name={isOffline ? 'cloud_off' : 'qr_code_scanner'} size="2.5rem" />
                    </div>
                    <div className={`${styles.pulseRing} ${isOffline ? styles.pulseRingOffline : ''}`} />
                </div>

                <h3>{t(isOffline ? 'bridge_offline_title' : 'whatsapp_pairing_required')}</h3>
                <p>
                    {isOffline ? t('bridge_offline_desc') : t('whatsapp_pairing_desc')}
                </p>

                {!isOffline && (
                    <div className={styles.qrWrapper}>
                        {bridgeStatus.qr_code ? (
                            <div className={`${styles.qrContainer} ${styles.animateZoomIn}`}>
                                <QRCodeSVG
                                    value={bridgeStatus.qr_code}
                                    size={240}
                                    level="H"
                                    className={styles.qrImage}
                                />
                            </div>
                        ) : (
                            <div className={styles.qrPlaceholder}>
                                <div className={styles.loader} />
                                <span>{t('generating_qr') || 'Generando código...'}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.pairingActions}>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onRefresh}
                        loading={statusLoading}
                        icon={<Icon name="refresh" size="1rem" />}
                    >
                        {t('whatsapp_refresh')}
                    </Button>
                </div>

                <div className={styles.pairingFooter}>
                    <span className={`${styles.statusIndicator} ${isOffline ? styles.statusIndicatorOffline : styles.statusIndicatorDisconnected}`}>
                        {isOffline ? t('offline') : t('waiting_connection')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WhatsappPairing;

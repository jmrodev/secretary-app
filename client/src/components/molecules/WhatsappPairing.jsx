import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { api } from '@/api/axios';
import styles from '../organisms/GlobalWhatsappMessenger.module.css';

/**
 * WhatsappPairing Molecule.
 * Renders the QR code or offline status for WhatsApp bridge pairing.
 * When connected, shows a disconnect button to force re-pairing.
 */
export const WhatsappPairing = ({ bridgeStatus, onRefresh, statusLoading, t }) => {
    const [logoutLoading, setLogoutLoading] = useState(false);
    const isOffline = bridgeStatus.status === 'offline';
    const isConnected = bridgeStatus.status === 'connected';

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await api.post('/whatsapp/logout');
            onRefresh();
        } catch (err) {
            console.error('[WhatsApp] Logout failed:', err);
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <div className={styles.pairing}>
            <div className={`${styles.pairingCard} ${styles.animateFadeIn}`}>

                <div className={styles.pairingIconWrapper}>
                    <div className={`${styles.pairingIcon} ${isOffline ? styles.pairingIconOffline : ''}`}>
                        <Icon
                            name={isOffline ? 'cloud_off' : isConnected ? 'check_circle' : 'qr_code_scanner'}
                            size="2.5rem"
                        />
                    </div>
                    <div className={`${styles.pulseRing} ${isOffline ? styles.pulseRingOffline : ''}`} />
                </div>

                <h3>{t(isOffline ? 'bridge_offline_title' : isConnected ? 'whatsapp_connected' : 'whatsapp_pairing_required')}</h3>
                <p>
                    {isOffline
                        ? t('bridge_offline_desc')
                        : isConnected
                            ? (t('whatsapp_connected_desc') || 'WhatsApp vinculado correctamente.')
                            : t('whatsapp_pairing_desc')}
                </p>

                {/* QR — solo cuando está desconectado (no offline, no connected) */}
                {!isOffline && !isConnected && (
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
                    {isConnected ? (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleLogout}
                            loading={logoutLoading}
                            icon={<Icon name="link_off" size="1rem" />}
                        >
                            {t('whatsapp_disconnect') || 'Desconectar'}
                        </Button>
                    ) : (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onRefresh}
                            loading={statusLoading}
                            icon={<Icon name="refresh" size="1rem" />}
                        >
                            {t('whatsapp_refresh')}
                        </Button>
                    )}
                </div>

                <div className={styles.pairingFooter}>
                    <span className={`${styles.statusIndicator} ${
                        isOffline
                            ? styles.statusIndicatorOffline
                            : isConnected
                                ? styles.statusIndicatorConnected
                                : styles.statusIndicatorDisconnected
                    }`}>
                        {isOffline
                            ? t('offline')
                            : isConnected
                                ? (t('connected') || 'Conectado')
                                : t('waiting_connection')}
                    </span>
                </div>
            </div>
        </div>
    );
};


import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { api } from '@/api/axios';
import styles from './WhatsappPairing.module.css';

/**
 * WhatsappPairing Molecule.
 * Renders the QR code or offline status for WhatsApp bridge pairing.
 * When connected, shows a disconnect button to force re-pairing.
 * Accepts optional qrCode prop for external use (ChatPage inline QR).
 */
export const WhatsappPairing = ({ bridgeStatus, onRefresh, statusLoading, t, qrCode }) => {
    const [logoutLoading, setLogoutLoading] = useState(false);
    const status = bridgeStatus.status;
    const isOffline = status === 'offline';
    const isConnected = status === 'connected';
    const isSessionExpired = status === 'session_expired';
    const isAwaitingAdmin = status === 'awaiting_admin';
    const isDisconnected = status === 'disconnected';
    const qrValue = qrCode ?? bridgeStatus.qr_code;

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
        <div className={styles.WhatsappPairing__pairing}>
            <div className={`${styles.WhatsappPairing__pairingCard} ${styles.WhatsappPairing__animateFadeIn}`}>

                <div className={styles.WhatsappPairing__pairingIconWrapper}>
                    <div className={`${styles.WhatsappPairing__pairingIcon} ${isOffline ? styles.WhatsappPairing__pairingIconOffline : ''}`}>
                        <Icon
                            name={isOffline ? 'cloud_off' : isConnected ? 'check_circle' : 'qr_code_scanner'}
                            size="2.5rem"
                        />
                    </div>
                    <div className={`${styles.WhatsappPairing__pulseRing} ${isOffline ? styles.WhatsappPairing__pulseRingOffline : ''}`} />
                </div>

                <h3>{t(isOffline ? 'bridge_offline_title' : isConnected ? 'whatsapp_connected' : isSessionExpired ? 'bridge_session_expired_title' : isAwaitingAdmin ? 'bridge_awaiting_admin_title' : isDisconnected ? 'whatsapp_pairing_required' : 'whatsapp_pairing_required')}</h3>
                <p>
                    {isOffline
                        ? t('bridge_offline_desc')
                        : isConnected
                            ? t('whatsapp_connected_desc')
                            : isSessionExpired
                                ? t('bridge_session_expired_desc')
                                : isAwaitingAdmin
                                    ? t('bridge_awaiting_admin_desc')
                                    : isDisconnected
                                        ? t('whatsapp_pairing_desc')
                                        : t('whatsapp_pairing_desc')}
                </p>

                {/* QR — solo cuando está desconectado/session_expired/awaiting_admin (no offline, no connected) */}
                {!isOffline && !isConnected && (
                    <div className={styles.WhatsappPairing__qrWrapper}>
                        {qrValue ? (
                            <div className={`${styles.WhatsappPairing__qrContainer} ${styles.WhatsappPairing__animateZoomIn}`}>
                                <QRCodeSVG
                                    value={qrValue}
                                    size={240}
                                    level="H"
                                    className={styles.WhatsappPairing__qrImage}
                                />
                            </div>
                        ) : (
                            <div className={styles.WhatsappPairing__qrPlaceholder}>
                                <div className={styles.WhatsappPairing__loader} />
                                <span>{t('generating_qr')}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.WhatsappPairing__pairingActions}>
                    {isConnected ? (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleLogout}
                            loading={logoutLoading}
                            icon={<Icon name="link_off" size="1rem" />}
                        >
                            {t('whatsapp_disconnect')}
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

                <div className={styles.WhatsappPairing__pairingFooter}>
                    <span className={`${styles.WhatsappPairing__statusIndicator} ${
                        isOffline
                            ? styles.WhatsappPairing__statusIndicatorOffline
                            : isConnected
                                ? styles.WhatsappPairing__statusIndicatorConnected
                                : styles.WhatsappPairing__statusIndicatorDisconnected
                    }`}>
                        {isOffline
                            ? t('offline')
                            : isConnected
                                ? t('connected')
                                : t('waiting_connection')}
                    </span>
                </div>
            </div>
        </div>
    );
};


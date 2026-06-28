import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';

/**
 * WhatsappPairing Molecule.
 * Renders the QR code or offline status for WhatsApp bridge pairing.
 */
const WhatsappPairing = ({ bridgeStatus, onRefresh, statusLoading, t }) => {
    return (
        <div className="global-wa-messenger__pairing">
            <div className="global-wa-messenger__pairing-card animate-fade-in">
                <div className="global-wa-messenger__pairing-icon-wrapper">
                    <div className={`global-wa-messenger__pairing-icon global-wa-messenger__pairing-icon--${bridgeStatus.status}`}>
                        <Icon name={bridgeStatus.status === 'offline' ? 'cloud_off' : 'qr_code_scanner'} size="2.5rem" />
                    </div>
                    <div className={`global-wa-messenger__pulse-ring global-wa-messenger__pulse-ring--${bridgeStatus.status}`}></div>
                </div>
                
                <h3>{t(bridgeStatus.status === 'offline' ? 'bridge_offline_title' : 'whatsapp_pairing_required')}</h3>
                <p>
                    {bridgeStatus.status === 'offline' 
                        ? t('bridge_offline_desc') 
                        : t('whatsapp_pairing_desc')}
                </p>
                
                {bridgeStatus.status !== 'offline' && (
                    <div className="global-wa-messenger__qr-wrapper">
                        {bridgeStatus.qr_code ? (
                            <div className="global-wa-messenger__qr-container animate-zoom-in">
                                <QRCodeSVG 
                                    value={bridgeStatus.qr_code}
                                    size={240}
                                    level="H"
                                    className="global-wa-messenger__qr-image"
                                />
                            </div>
                        ) : (
                            <div className="global-wa-messenger__qr-placeholder">
                                <div className="global-wa-messenger__loader"></div>
                                <span>{t('generating_qr') || 'Generando código...'}</span>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="global-wa-messenger__pairing-actions">
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
                
                <div className="global-wa-messenger__pairing-footer">
                    <span className={`global-wa-messenger__status-indicator global-wa-messenger__status-indicator--${bridgeStatus.status}`}>
                        {bridgeStatus.status === 'offline' ? t('offline') : t('waiting_connection')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WhatsappPairing;

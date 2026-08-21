import React from 'react';
import shared from '@/styles/shared.module.css';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import styles from './IntegrationMetaWhatsApp.module.css';

/**
 * IntegrationMetaWhatsApp Feature Molecule.
 * Configuration panel for official Meta WhatsApp Cloud API credentials.
 */
export const IntegrationMetaWhatsApp = ({ settings, updateSetting, onTestMeta, loading, isAuthorized }) => {
    return (
        <div className={`${shared.ConfigSection} ${shared.AnimateFadeIn}`}>
            <div className={shared.ConfigSection__header}>
                <span className={shared.ConfigSection__icon}><Icon name="chat" /></span>
                <h3 className={shared.ConfigSection__title}>Meta Business (WhatsApp API)</h3>
            </div>

            <div className={shared.ConfigSection__body}>
                <p className={styles.IntegrationMetaWhatsApp__hint}>
                    Configure las credenciales de WhatsApp Cloud API.
                </p>

                <ConfigField
                    id="meta-phone-id"
                    label="Phone Number ID"
                    value={settings.meta_phone_number_id || ''}
                    onChange={(e) => updateSetting('meta_phone_number_id', e.target.value)}
                    disabled={!isAuthorized}
                    className={styles.IntegrationMetaWhatsApp__inputMonospace}
                />

                <ConfigField
                    id="meta-token"
                    label="Access Token"
                    type="password"
                    value={settings.meta_access_token || ''}
                    onChange={(e) => updateSetting('meta_access_token', e.target.value)}
                    placeholder={settings.meta_access_token === 'MASKED_PRESENT' ? '•••••••• (Guardado)' : 'Pegar Token aquí...'}
                    disabled={!isAuthorized}
                    className={styles.IntegrationMetaWhatsApp__inputMonospace}
                />

                <div className={styles.IntegrationMetaWhatsApp__actions}>
                    <Button
                        onClick={onTestMeta}
                        disabled={loading || !settings.meta_phone_number_id}
                        icon={<Icon name="science" />}
                    >
                        Probar Conexión
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                        icon={<Icon name="build" />}
                    >
                        Setup Guide
                    </Button>
                </div>
            </div>
        </div>
    );
};


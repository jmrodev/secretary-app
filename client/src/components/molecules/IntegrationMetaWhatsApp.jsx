import React from 'react';
import './IntegrationMetaWhatsApp.css';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import ConfigField from '../molecules/ConfigField';

/**
 * IntegrationMetaWhatsApp Molecule.
 * Handles the configuration of Meta Business WhatsApp API credentials.
 */
const IntegrationMetaWhatsApp = ({ settings, updateSetting, onTestMeta, loading, isAuthorized }) => {
    return (
        <div className="config-section">
            <div className="config-section__header">
                <Icon name="CHAT" className="config-section__icon" />
                <h3 className="config-section__title">Meta Business (WhatsApp API)</h3>
            </div>

            <div className="config-section__body">
                <p className="config-field__hint config-field__hint--mb-15">
                    Configure las credenciales de WhatsApp Cloud API.
                </p>

                <ConfigField
                    id="meta-phone-id"
                    label="Phone Number ID"
                    value={settings.meta_phone_number_id || ''}
                    onChange={(e) => updateSetting('meta_phone_number_id', e.target.value)}
                    disabled={!isAuthorized}
                    className="font-mono text-sm"
                />

                <ConfigField
                    id="meta-token"
                    label="Access Token"
                    type="password"
                    value={settings.meta_access_token || ''}
                    onChange={(e) => updateSetting('meta_access_token', e.target.value)}
                    placeholder={settings.meta_access_token === 'MASKED_PRESENT' ? '•••••••• (Guardado)' : 'Pegar Token aquí...'}
                    disabled={!isAuthorized}
                    className="font-mono text-sm"
                />

                <div className="config-actions">
                    <Button
                        onClick={onTestMeta}
                        disabled={loading || !settings.meta_phone_number_id}
                        icon={<Icon name="SYNC" />}
                    >
                        Probar Conexión
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                        icon={<Icon name="CONFIG" />}
                    >
                        Setup Guide
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default IntegrationMetaWhatsApp;

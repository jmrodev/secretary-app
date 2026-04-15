import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import ConfigField from './ConfigField';
import './IntegrationMetaWhatsApp.css';

/**
 * IntegrationMetaWhatsApp Feature Molecule.
 * Configuration panel for official Meta WhatsApp Cloud API credentials.
 */
const IntegrationMetaWhatsApp = ({ settings, updateSetting, onTestMeta, loading, isAuthorized }) => {
    return (
        <div className="config-section animate-fadeIn integration-meta-whatsapp">
            <div className="config-section__header">
                <Icon name="chat" size="1.5rem" className="config-section__icon" />
                <h3 className="config-section__title">Meta Business (WhatsApp API)</h3>
            </div>

            <div className="config-section__body">
                <p className="config-field__hint integration-meta-whatsapp__intro">
                    Configure las credenciales de WhatsApp Cloud API.
                </p>

                <ConfigField
                    id="meta-phone-id"
                    label="Phone Number ID"
                    value={settings.meta_phone_number_id || ''}
                    onChange={(e) => updateSetting('meta_phone_number_id', e.target.value)}
                    disabled={!isAuthorized}
                    variant="monospace"
                />

                <ConfigField
                    id="meta-token"
                    label="Access Token"
                    type="password"
                    value={settings.meta_access_token || ''}
                    onChange={(e) => updateSetting('meta_access_token', e.target.value)}
                    placeholder={settings.meta_access_token === 'MASKED_PRESENT' ? '•••••••• (Guardado)' : 'Pegar Token aquí...'}
                    disabled={!isAuthorized}
                    variant="monospace"
                />

                <div className="config-actions">
                    <Button
                        onClick={onTestMeta}
                        disabled={loading || !settings.meta_phone_number_id}
                        icon={<Icon name="build" size="1.1rem" />}
                    >
                        Probar Conexión
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                        icon={<Icon name="link" size="1.1rem" />}
                    >
                        Setup Guide
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default IntegrationMetaWhatsApp;

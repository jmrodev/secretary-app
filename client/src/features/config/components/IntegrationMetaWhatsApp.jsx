import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
<<<<<<< HEAD
import ConfigField from './ConfigField';
import './IntegrationMetaWhatsApp.css';
=======
import ConfigField from '@/features/config/components/ConfigField';
>>>>>>> main

/**
 * IntegrationMetaWhatsApp Feature Molecule.
 * Configuration panel for official Meta WhatsApp Cloud API credentials.
 */
const IntegrationMetaWhatsApp = ({ settings, updateSetting, onTestMeta, loading, isAuthorized }) => {
    return (
        <div className="config-section animate-fadeIn integration-meta-whatsapp">
            <div className="config-section__header">
<<<<<<< HEAD
                <Icon name="chat" size="1.5rem" className="config-section__icon" />
=======
                <span className="config-section__icon"><Icon name="chat" /></span>
>>>>>>> main
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
<<<<<<< HEAD
                        icon={<Icon name="build" size="1.1rem" />}
=======
                        icon={<Icon name="science" />}
>>>>>>> main
                    >
                        Probar Conexión
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
<<<<<<< HEAD
                        icon={<Icon name="link" size="1.1rem" />}
=======
                        icon={<Icon name="build" />}
>>>>>>> main
                    >
                        Setup Guide
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default IntegrationMetaWhatsApp;

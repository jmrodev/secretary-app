import React from 'react';
<<<<<<< HEAD
import './IntegrationMetaWhatsApp.css';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import ConfigField from '../molecules/ConfigField';
=======
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import ConfigField from '@/components/molecules/ConfigField';
>>>>>>> main

/**
 * IntegrationMetaWhatsApp Molecule.
 * Handles the configuration of Meta Business WhatsApp API credentials.
 */
const IntegrationMetaWhatsApp = ({ settings, updateSetting, onTestMeta, loading, isAuthorized }) => {
    return (
        <div className="config-section">
            <div className="config-section__header">
<<<<<<< HEAD
                <Icon name="CHAT" className="config-section__icon" />
=======
                <span className="config-section__icon"><Icon name="chat" /></span>
>>>>>>> main
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
<<<<<<< HEAD
                        icon={<Icon name="SYNC" />}
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
                        icon={<Icon name="CONFIG" />}
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

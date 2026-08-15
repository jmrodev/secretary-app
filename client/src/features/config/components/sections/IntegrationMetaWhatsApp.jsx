import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { ConfigField } from '@/features/config/components/ui/ConfigField';

/**
 * IntegrationMetaWhatsApp Feature Molecule.
 * Configuration panel for official Meta WhatsApp Cloud API credentials.
 */
export const IntegrationMetaWhatsApp = ({ settings, updateSetting, onTestMeta, loading, isAuthorized }) => {
    return (
        <div className="config-section animate-fade-in">
            <div className="config-section__header">
                <span className="config-section__icon"><Icon name="chat" /></span>
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
                    className="config-field__input--monospace"
                />

                <ConfigField
                    id="meta-token"
                    label="Access Token"
                    type="password"
                    value={settings.meta_access_token || ''}
                    onChange={(e) => updateSetting('meta_access_token', e.target.value)}
                    placeholder={settings.meta_access_token === 'MASKED_PRESENT' ? '•••••••• (Guardado)' : 'Pegar Token aquí...'}
                    disabled={!isAuthorized}
                    className="config-field__input--monospace"
                />

                <div className="config-actions">
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


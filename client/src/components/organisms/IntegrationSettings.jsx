import React from 'react';
import Button from '../atoms/Button';
import ConfigToggle from '../molecules/ConfigToggle';
import ConfigField from '../molecules/ConfigField';
import StatusIndicator from '../atoms/StatusIndicator';
import Alert from '../atoms/Alert';

/**
 * IntegrationSettings Organism
 * 
 * Displays integration settings for Google Calendar, WhatsApp, and Cloudflare
 * Uses BEM CSS methodology and Atomic Design principles
 */

/**
 * Single Responsibility: Render Google Calendar integration section
 */
const renderGoogleIntegration = ({
    googleUnlinked,
    settings,
    updateSetting,
    onGoogleAuth,
    onDisconnectGoogle,
    onRefreshToken,
    onRetryGoogle,
    loading
}) => {
    const status = googleUnlinked ? 'disconnected' : 'connected';
    const statusLabel = googleUnlinked ? 'Desconectado' : 'Conectado';

    return (
        <div className="config-section">
            <div className="config-section__header">
                <span className="config-section__icon">📅</span>
                <h2 className="config-section__title">Integración con Google Calendar</h2>
            </div>

            <div className="config-section__body">
                <div className="config-group">
                    <div className="config-group__header">
                        <div>
                            <p className="config-field__hint" style={{ marginBottom: '0.75rem' }}>
                                Conecta tu cuenta de Google para sincronizar turnos automáticamente.
                            </p>
                            <StatusIndicator status={status} label={`Estado: ${statusLabel}`} />
                        </div>

                        {!googleUnlinked && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <ConfigToggle
                                    id="google-sync-toggle"
                                    label={settings.google_sync_enabled === 'false' ? '⏸️ Sincronización PAUSADA' : '✅ Sincronización ACTIVA'}
                                    checked={settings.google_sync_enabled !== 'false'}
                                    onChange={(val) => updateSetting('google_sync_enabled', val ? 'true' : 'false')}
                                    className="flex-row-reverse gap-3"
                                />
                                <p className="config-field__hint" style={{ textAlign: 'right', margin: 0 }}>
                                    Si pausas, los cambios en la App no se enviarán a Google.
                                </p>
                            </div>
                        )}
                    </div>

                    {!googleUnlinked ? (
                        <div className="config-group__items">
                            <div className="config-actions">
                                <Button variant="secondary" onClick={onRefreshToken}>
                                    🔄 Refrescar Enlace
                                </Button>
                                <Button variant="danger" onClick={onDisconnectGoogle}>
                                    ❌ Desconectar Cuenta
                                </Button>
                            </div>

                            <Alert variant="warning" title="¿Problemas de Sincronización?">
                                <p className="config-alert__message">
                                    Si los turnos no se están enviando a Google, puede que haya elementos atascados.
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onRetryGoogle}
                                    disabled={loading}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    ⚡ Reintentar Elementos Fallidos
                                </Button>
                            </Alert>
                        </div>
                    ) : (
                        <div className="config-actions">
                            <Button onClick={onGoogleAuth}>
                                Conectar Google Calendar
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Single Responsibility: Render Meta WhatsApp integration section
 */
const renderMetaIntegration = ({ settings, updateSetting, onTestMeta, loading, isAdmin }) => {
    return (
        <div className="config-section">
            <div className="config-section__header">
                <span className="config-section__icon">💬</span>
                <h3 className="config-section__title">Meta Business (WhatsApp API)</h3>
            </div>

            <div className="config-section__body">
                <p className="config-field__hint" style={{ marginBottom: '1.5rem' }}>
                    Configure las credenciales de WhatsApp Cloud API.
                </p>

                <ConfigField
                    id="meta-phone-id"
                    label="Phone Number ID"
                    value={settings.meta_phone_number_id || ''}
                    onChange={(e) => updateSetting('meta_phone_number_id', e.target.value)}
                    disabled={!isAdmin}
                    className="font-mono text-sm"
                />

                <ConfigField
                    id="meta-token"
                    label="Access Token"
                    type="password"
                    value={settings.meta_access_token || ''}
                    onChange={(e) => updateSetting('meta_access_token', e.target.value)}
                    placeholder={settings.meta_access_token === 'MASKED_PRESENT' ? '•••••••• (Guardado)' : 'Pegar Token aquí...'}
                    disabled={!isAdmin}
                    className="font-mono text-sm"
                />

                <div className="config-actions">
                    <Button
                        onClick={onTestMeta}
                        disabled={loading || !settings.meta_phone_number_id}
                    >
                        🧪 Probar Conexión
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                    >
                        🛠️ Setup Guide
                    </Button>
                </div>
            </div>
        </div>
    );
};

/**
 * Single Responsibility: Render Cloudflare tunnel section
 */
const renderCloudflareSection = ({ settings, onRefreshTunnel, loading }) => {
    return (
        <div className="config-section">
            <div className="config-section__header">
                <span className="config-section__icon">🌐</span>
                <h3 className="config-section__title">Conectividad Web (Cloudflare)</h3>
            </div>

            <div className="config-section__body">
                <div className="config-group">
                    <div className="config-group__header">
                        <div style={{ flex: 1, minWidth: '280px' }}>
                            <span className="config-group__title">Estado del Túnel</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                                <StatusIndicator status="connected" label="Túnel Activo" />
                                <div className="config-url-display">
                                    {settings.public_base_url || 'No detectada'}
                                </div>
                            </div>
                        </div>
                        <Button onClick={onRefreshTunnel} disabled={loading}>
                            🔄 Refrescar Túnel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const IntegrationSettings = ({
    user,
    settings,
    updateSetting,
    loading,
    googleUnlinked,
    onGoogleAuth,
    onDisconnectGoogle,
    onRefreshToken,
    onRetryGoogle,
    onRefreshTunnel,
    onTestMeta
}) => {
    const isAdmin = user.role === 'admin';

    return (
        <div className="tab-panel animate-in">
            {renderGoogleIntegration({
                googleUnlinked,
                settings,
                updateSetting,
                onGoogleAuth,
                onDisconnectGoogle,
                onRefreshToken,
                onRetryGoogle,
                loading
            })}

            {renderMetaIntegration({
                settings,
                updateSetting,
                onTestMeta,
                loading,
                isAdmin
            })}

            {renderCloudflareSection({
                settings,
                onRefreshTunnel,
                loading
            })}
        </div>
    );
};

export default IntegrationSettings;

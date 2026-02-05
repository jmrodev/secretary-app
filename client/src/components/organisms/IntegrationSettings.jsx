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
                    <div className="config-group__header config-flex config-flex--gap-2" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p className="config-field__hint" style={{ marginBottom: '0.75rem' }}>
                                Conecta tu cuenta de Google para sincronizar turnos automáticamente.
                            </p>
                            <StatusIndicator status={status} label={`Estado: ${statusLabel}`} />
                        </div>

                        {!googleUnlinked && (
                            <div className="config-flex config-flex--column" style={{ alignItems: 'flex-end', gap: '0.5rem' }}>
                                <ConfigToggle
                                    id="google-sync-toggle"
                                    label={settings.google_sync_enabled === 'false' ? '⏸️ Sincronización PAUSADA' : '✅ Sincronización ACTIVA'}
                                    checked={settings.google_sync_enabled !== 'false'}
                                    onChange={(val) => updateSetting('google_sync_enabled', val ? 'true' : 'false')}
                                />
                                <p className="config-field__hint" style={{ textAlign: 'right', margin: 0 }}>
                                    Si pausas, los cambios en la App no se enviarán a Google.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Rest of Google section refactored */}
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

                            <div className="config-section__divider"></div>

                            <div className="config-field">
                                <label className="config-field__label">Google Sheets - ID de Hoja de Cálculo (Finanzas)</label>
                                <p className="config-field__hint">
                                    Pega el ID de la hoja de cálculo de Google donde deseas respaldar las transacciones.
                                    <br />
                                    <small>El ID se encuentra en la URL: docs.google.com/spreadsheets/d/<b>ID_AQUI</b>/edit</small>
                                </p>
                                <ConfigField
                                    id="finance-spreadsheet-id"
                                    value={settings.finance_spreadsheet_id || ''}
                                    onChange={(e) => updateSetting('finance_spreadsheet_id', e.target.value)}
                                    placeholder="e.g. 1aBCdEfGhIjKlMnOpQrStUvWxYz1234567890"
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="config-actions">
                            <Button onClick={onGoogleAuth}>
                                Conectar Google Workspaces
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
 * Single Responsibility: Render Remote Access section (Cloudflare/DuckDNS)
 */
const renderRemoteAccessSection = ({ settings, updateSetting, onRefreshTunnel, loading, isAdmin }) => {
    const method = settings.remote_access_method || 'cloudflare';

    return (
        <div className="config-section">
            <div className="config-section__header">
                <span className="config-section__icon">🌐</span>
                <h3 className="config-section__title">Acceso Remoto (Internet)</h3>
            </div>

            <div className="config-section__body">
                <p className="config-field__hint" style={{ marginBottom: '1.5rem' }}>
                    Elija cómo desea acceder a la aplicación cuando no esté en el consultorio.
                </p>

                <div className="config-field">
                    <label className="config-field__label">Método de Acceso</label>
                    <select
                        className="input-field"
                        value={method}
                        onChange={(e) => updateSetting('remote_access_method', e.target.value)}
                        disabled={!isAdmin}
                    >
                        <option value="cloudflare">Cloudflare Tunnel (Recomendado - Sin configurar router)</option>
                        <option value="duckdns">DuckDNS (Requiere configuración de Router / Port Forwarding)</option>
                        <option value="none">Deshabilitado (Solo acceso local)</option>
                    </select>
                </div>

                <div className="config-section__divider"></div>

                {method === 'cloudflare' && (
                    <div className="animate-fadeIn">
                        <div className="config-group">
                            <div className="config-group__header">
                                <div style={{ flex: 1 }}>
                                    <span className="config-group__title">Estado del Túnel</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                                        <StatusIndicator status="connected" label="Túnel Activo" />
                                        <div className="config-url-display">
                                            {settings.public_base_url || 'Detectando URL...'}
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={onRefreshTunnel} disabled={loading} size="sm">
                                    🔄 Generar Nueva URL
                                </Button>
                            </div>
                        </div>
                        <Alert variant="info" style={{ marginTop: '1rem' }}>
                            Cloudflare Tunnel permite acceso seguro sin abrir puertos en su router. La URL es temporal.
                        </Alert>
                    </div>
                )}

                {method === 'duckdns' && (
                    <div className="animate-fadeIn">
                        <div className="config-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <ConfigField
                                id="duckdns-domain"
                                label="Subdominio DuckDNS"
                                value={settings.duckdns_domain || ''}
                                onChange={(e) => updateSetting('duckdns_domain', e.target.value)}
                                placeholder="ej: mi-consultorio"
                                hint="No incluya '.duckdns.org'"
                                disabled={!isAdmin}
                            />
                            <ConfigField
                                id="duckdns-token"
                                label="Token de DuckDNS"
                                type="password"
                                value={settings.duckdns_token || ''}
                                onChange={(e) => updateSetting('duckdns_token', e.target.value)}
                                placeholder={settings.duckdns_token === 'MASKED_PRESENT' ? '••••••••' : 'Pegar token...'}
                                disabled={!isAdmin}
                            />
                        </div>

                        <div className="config-url-display" style={{ marginTop: '1rem' }}>
                            URL: {settings.duckdns_domain ? `http://${settings.duckdns_domain}.duckdns.org` : 'Configure su dominio'}
                        </div>

                        <div className="config-section__divider"></div>

                        <div className="config-guide">
                            <h4 style={{ marginBottom: '0.75rem', color: 'var(--slate-800)' }}>📖 Guía de Configuración DuckDNS</h4>
                            <ol className="config-guide__list" style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.6' }}>
                                <li>Registre un subdominio gratuito en <a href="https://www.duckdns.org" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">duckdns.org</a>.</li>
                                <li>Copie el <b>Token</b> y el <b>Subdominio</b> en los campos de arriba.</li>
                                <li>Lo más importante: Debe configurar el <b>Port Forwarding</b> en su Router.</li>
                                <li>Reenvíe el puerto externo <b>80</b> (o el que prefiera) a la IP local del servidor en el puerto <b>5173</b> (Dev) o <b>3001</b> (Prod).</li>
                                <li>Asegúrese de que el servidor tenga una IP local fija (estática).</li>
                            </ol>
                        </div>
                    </div>
                )}
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
        <div className="tab-panel animate-fadeIn">
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

            {renderRemoteAccessSection({
                settings,
                updateSetting,
                onRefreshTunnel,
                loading,
                isAdmin
            })}
        </div>
    );
};

export default IntegrationSettings;

import React from 'react';
import Button from '@/components/atoms/Button';
<<<<<<< HEAD
import ConfigField from '@/components/molecules/ConfigField';
import StatusIndicator from '@/components/atoms/StatusIndicator';
import Alert from '@/components/atoms/Alert';
import Icon from '@/components/atoms/Icon';
import './IntegrationRemoteAccess.css';
=======
import Icon from '@/components/atoms/Icon';
import ConfigField from '@/components/molecules/ConfigField';
>>>>>>> main

/**
 * IntegrationRemoteAccess Molecule.
 * Manages remote access methods including Cloudflare Tunnel and DuckDNS.
 */
const IntegrationRemoteAccess = ({ settings, updateSetting, onRefreshTunnel, loading, isAuthorized }) => {
    const method = settings.remote_access_method || 'none';

    return (
        <div className="config-section">
            <div className="config-section__header">
<<<<<<< HEAD
                <Icon name="LANGUAGE" className="config-section__icon" />
=======
                <span className="config-section__icon"><Icon name="language" /></span>
>>>>>>> main
                <h3 className="config-section__title">Acceso Remoto (Internet)</h3>
            </div>

            <div className="config-section__body">
                <p className="config-field__hint config-field__hint--mb-15">
                    Elija cómo desea acceder a la aplicación cuando no esté en el consultorio.
                </p>

                <div className="config-field">
                    <label className="config-field__label">Método de Acceso</label>
                    <select
                        className="input-field"
                        value={method}
                        onChange={(e) => updateSetting('remote_access_method', e.target.value)}
                        disabled={!isAuthorized}
                    >
                        <option value="duckdns">DuckDNS (Requiere configuración de Router / Port Forwarding)</option>
                        <option value="none">Deshabilitado (Solo acceso local)</option>
                    </select>
                </div>

                <div className="config-section__divider"></div>



                {method === 'duckdns' && (
                    <div className="animate-fadeIn">
                        <div className="config-grid config-grid--2col config-grid--gap-1">
                            <ConfigField
                                id="duckdns-domain"
                                label="Subdominio DuckDNS"
                                value={settings.duckdns_domain || ''}
                                onChange={(e) => updateSetting('duckdns_domain', e.target.value)}
                                placeholder="ej: mi-consultorio"
                                hint="No incluya '.duckdns.org'"
                                disabled={!isAuthorized}
                            />
                            <ConfigField
                                id="duckdns-token"
                                label="Token de DuckDNS"
                                type="password"
                                value={settings.duckdns_token || ''}
                                onChange={(e) => updateSetting('duckdns_token', e.target.value)}
                                placeholder={settings.duckdns_token === 'MASKED_PRESENT' ? '••••••••' : 'Pegar token...'}
                                disabled={!isAuthorized}
                            />
                        </div>

                        <div className="config-flex config-flex--align-center config-flex--mt-1">
                            <div className="config-url-display config-flex__item--grow">
                                URL: {settings.duckdns_domain ? `http://${settings.duckdns_domain}.duckdns.org` : 'Configure su dominio'}
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={onRefreshTunnel}
                                disabled={loading || !settings.duckdns_domain || !settings.duckdns_token}
<<<<<<< HEAD
                                icon={<Icon name="SYNC" />}
=======
                                icon={<Icon name="sync" />}
>>>>>>> main
                            >
                                Renovar IP
                            </Button>
                        </div>

                        <div className="config-section__divider"></div>

                        <div className="config-guide">
<<<<<<< HEAD
                            <h4 className="remote-access__guide-title">
                                <Icon name="MENU_BOOK" size="1.2rem" /> Guía de Configuración DuckDNS
                            </h4>
                            <ol className="config-guide__list remote-access__guide-list">
=======
                            <h4 style={{ marginBottom: '0.75rem', color: 'var(--slate-800)' }}><Icon name="menu_book" className="mr-1" />Guía de Configuración DuckDNS</h4>
                            <ol className="config-guide__list" style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.6' }}>
>>>>>>> main
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

export default IntegrationRemoteAccess;

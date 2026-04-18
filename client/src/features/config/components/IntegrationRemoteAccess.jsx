import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import ConfigField from './ConfigField';
import Select from '@/components/atoms/Select';

/**
 * IntegrationRemoteAccess Feature Molecule.
 * Management of external access methods like DuckDNS or local-only mode.
 */
const IntegrationRemoteAccess = ({ settings, updateSetting, onRefreshTunnel, loading, isAuthorized }) => {
    const method = settings.remote_access_method || 'none';

    return (
        <div className="config-section animate-fadeIn">
            <div className="config-section__header">
                <span className="config-section__icon"><Icon name="language" /></span>
                <h3 className="config-section__title">Acceso Remoto (Internet)</h3>
            </div>

            <div className="config-section__body">
                <p className="config-field__hint config-field__hint--mb-15">
                    Elija cómo desea acceder a la aplicación cuando no esté en el consultorio.
                </p>

                <div className="config-field">
                    <label className="config-field__label">Método de Acceso</label>
                    <Select
                        id="remote-access-method"
                        value={method}
                        onChange={(e) => updateSetting('remote_access_method', e.target.value)}
                        disabled={!isAuthorized}
                        options={[
                            { value: 'duckdns', label: 'DuckDNS (Requiere configuración de Router / Port Forwarding)' },
                            { value: 'none', label: 'Deshabilitado (Solo acceso local)' }
                        ]}
                    />
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
                                icon={<Icon name="sync" />}
                            >
                                Renovar IP
                            </Button>
                        </div>

                        <div className="config-section__divider"></div>

                        <div className="config-guide">
                            <h4 className="config-guide__title"><Icon name="menu_book" className="mr-1" />Guía de Configuración DuckDNS</h4>
                            <ol className="config-guide__list">
                                <li>Registre un subdominio gratuito en <a href="https://www.duckdns.org" target="_blank" rel="noreferrer" className="config-link">duckdns.org</a>.</li>
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

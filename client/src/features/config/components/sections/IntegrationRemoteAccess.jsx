import React from 'react';
import shared from '@/styles/shared.module.css';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Select } from '@/components/atoms/Select';
import styles from './IntegrationRemoteAccess.module.css';

/**
 * IntegrationRemoteAccess Feature Molecule.
 * Management of external access methods like DuckDNS or local-only mode.
 */
export const IntegrationRemoteAccess = ({ settings, updateSetting, onRefreshTunnel, loading, isAuthorized }) => {
    const method = settings.remote_access_method || 'none';

    return (
        <div className={`${shared.ConfigSection} ${shared.AnimateFadeIn}`}>
            <div className={shared.ConfigSection__header}>
                <span className={shared.ConfigSection__icon}><Icon name="language" /></span>
                <h3 className={shared.ConfigSection__title}>Acceso Remoto (Internet)</h3>
            </div>

            <div className={shared.ConfigSection__body}>
                <p className="config-field__hint config-field__hint--mb-15">
                    Elija cómo desea acceder a la aplicación cuando no esté en el consultorio.
                </p>

                <div className="config-field">
                    <label htmlFor="remote-access-method" className="config-field__label">Método de Acceso</label>
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

                <div className={shared.ConfigSection__divider}></div>

                {method === 'duckdns' && (
                    <div className={shared.AnimateFadeIn}>
                        <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--2col']} ${shared['ConfigGrid--gap1']}`}>
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

                        <div className={shared.ConfigSection__divider}></div>

                        <div className={styles.IntegrationRemoteAccess__guide}>
                            <h4 className={styles.IntegrationRemoteAccess__guideTitle}><Icon name="menu_book" className="mr-1" />Guía de Configuración DuckDNS</h4>
                            <ol className={styles.IntegrationRemoteAccess__guideList}>
                                <li>Registre un subdominio gratuito en <a href="https://www.duckdns.org" target="_blank" rel="noreferrer" className={styles.IntegrationRemoteAccess__link}>duckdns.org</a>.</li>
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


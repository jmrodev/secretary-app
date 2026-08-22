import React from 'react';
import shared from '@/styles/shared.module.css';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Select } from '@/components/atoms/Select';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './IntegrationRemoteAccess.module.css';

/**
 * IntegrationRemoteAccess Feature Molecule.
 * Management of networking URLs, remote access methods (DuckDNS/Cloudflare), and mobile app.
 */
export const IntegrationRemoteAccess = ({ settings, updateSetting, onRefreshTunnel, onShowQr, loading, isAuthorized }) => {
    const { t } = useLanguage();
    const method = settings.remote_access_method || 'none';

    return (
        <div className={`${shared.ConfigSection} ${shared.AnimateFadeIn}`}>
            <div className={shared.ConfigSection__header}>
                <span className={shared.ConfigSection__icon}><Icon name="language" /></span>
                <h3 className={shared.ConfigSection__title}>{t('remote_access_title')}</h3>
            </div>

            <div className={shared.ConfigSection__body}>
                <p className={styles.IntegrationRemoteAccess__hint}>
                    {t('remote_access_description')}
                </p>

                {/* System URLs Grid */}
                <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--1col']}`}>
                    <ConfigField
                        id="public-base-url"
                        label={t('remote_access_public_url_label')}
                        type="url"
                        placeholder={t('remote_access_public_url_placeholder')}
                        value={settings.public_base_url || ''}
                        onChange={(e) => updateSetting('public_base_url', e.target.value)}
                        disabled={!isAuthorized}
                        hint={t('remote_access_public_url_hint')}
                    />

                    <div>
                        <ConfigField
                            id="staff-base-url"
                            label={t('remote_access_local_url_label')}
                            type="text"
                            placeholder={t('remote_access_local_url_placeholder')}
                            value={settings.staff_base_url || ''}
                            onChange={(e) => updateSetting('staff_base_url', e.target.value)}
                            disabled={!isAuthorized}
                            hint={t('remote_access_local_url_hint')}
                        />
                        {onShowQr && (
                            <div className={styles.IntegrationRemoteAccess__actions}>
                                <Button
                                    variant="secondary"
                                    onClick={onShowQr}
                                    title={t('remote_access_qr_title')}
                                    icon={<Icon name="smartphone" size="1.2rem" />}
                                >
                                    {t('remote_access_qr_button')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={shared.ConfigSection__divider}></div>

                {/* DuckDNS & Alternative Methods */}
                <ConfigField
                    id="remote-access-method"
                    label={t('remote_access_method_label')}
                    type="select"
                    value={method}
                    onChange={(e) => updateSetting('remote_access_method', e.target.value)}
                    disabled={!isAuthorized}
                    options={[
                        { value: 'none', label: t('remote_access_method_none') },
                        { value: 'duckdns', label: t('remote_access_method_duckdns') }
                    ]}
                />

                {method === 'duckdns' && (
                    <div className={shared.AnimateFadeIn}>
                        <div className={`${shared.ConfigGrid} ${shared['ConfigGrid--1col']}`}>
                            <ConfigField
                                id="duckdns-domain"
                                label={t('remote_access_duckdns_domain_label')}
                                value={settings.duckdns_domain || ''}
                                onChange={(e) => updateSetting('duckdns_domain', e.target.value)}
                                placeholder={t('remote_access_duckdns_domain_placeholder')}
                                hint={t('remote_access_duckdns_domain_hint')}
                                disabled={!isAuthorized}
                            />
                            <ConfigField
                                id="duckdns-token"
                                label={t('remote_access_duckdns_token_label')}
                                type="password"
                                value={settings.duckdns_token || ''}
                                onChange={(e) => updateSetting('duckdns_token', e.target.value)}
                                placeholder={settings.duckdns_token === 'MASKED_PRESENT' ? t('remote_access_duckdns_token_placeholder_saved') : t('remote_access_duckdns_token_placeholder_empty')}
                                disabled={!isAuthorized}
                            />
                        </div>

                        <div className={styles.IntegrationRemoteAccess__actions}>
                            <div className={styles.IntegrationRemoteAccess__urlDisplay}>
                                {t('remote_access_duckdns_url', { url: settings.duckdns_domain ? `http://${settings.duckdns_domain}.duckdns.org` : t('remote_access_duckdns_configure') })}
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={onRefreshTunnel}
                                disabled={loading || !settings.duckdns_domain || !settings.duckdns_token}
                                icon={<Icon name="sync" />}
                            >
                                {t('remote_access_renew_ip')}
                            </Button>
                        </div>

                        <div className={shared.ConfigSection__divider}></div>

                        <div className={styles.IntegrationRemoteAccess__guide}>
                            <h4 className={styles.IntegrationRemoteAccess__guideTitle}><Icon name="menu_book" />{t('duckdns_guide_title')}</h4>
                            <ol className={styles.IntegrationRemoteAccess__guideList}>
                                <li>{t('duckdns_guide_step1')} <a href="https://www.duckdns.org" target="_blank" rel="noreferrer" className={styles.IntegrationRemoteAccess__link}>duckdns.org</a>.</li>
                                <li>{t('duckdns_guide_step2_p1')} <b>Token</b> {t('duckdns_guide_step2_p2')} <b>{t('subdomain')}</b> {t('duckdns_guide_step2_p3')}</li>
                                <li>{t('duckdns_guide_step3_p1')} <b>Port Forwarding</b> {t('duckdns_guide_step3_p2')}</li>
                                <li>{t('duckdns_guide_step4_p1')} <b>80</b> {t('duckdns_guide_step4_p2')} <b>5173</b> (Dev) {t('or')} <b>3001</b> (Prod).</li>
                                <li>{t('duckdns_guide_step5')}</li>
                            </ol>
                        </div>
                    </div>
                )}

                <div className={shared.ConfigSection__divider}></div>

                {/* Mobile App Download Card */}
                <div className={styles.IntegrationRemoteAccess__mobileCard}>
                    <div className={styles.IntegrationRemoteAccess__mobileInfo}>
                        <div className={styles.IntegrationRemoteAccess__mobileIcon}>
                            <Icon name="smartphone" size="1.2rem" />
                        </div>
                        <div>
                            <h4 className={styles.IntegrationRemoteAccess__mobileTitle}>
                                {t('remote_access_mobile_app_title')}
                            </h4>
                            <p className={styles.IntegrationRemoteAccess__mobileDesc}>
                                {t('remote_access_mobile_app_description')}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<Icon name="DOWNLOAD" size="1rem" />}
                        onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                    >
                        {t('remote_access_download_apk')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
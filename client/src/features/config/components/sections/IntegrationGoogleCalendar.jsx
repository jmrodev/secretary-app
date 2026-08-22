import React from 'react';
import shared from '@/styles/shared.module.css';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { StatusIndicator } from '@/components/atoms/StatusIndicator';
import { ConfigToggle } from '@/features/config/components/ui/ConfigToggle';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Alert } from '@/components/atoms/Alert';
import styles from './IntegrationGoogleCalendar.module.css';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * IntegrationGoogleCalendar Feature Molecule.
 * Manages Google Calendar connection, sync status, and financial spreadsheet IDs.
 */
export const IntegrationGoogleCalendar = ({
    googleUnlinked,
    settings,
    updateSetting,
    onGoogleAuth,
    onDisconnectGoogle,
    onRefreshToken,
    onRetryGoogle,
    loading
}) => {
    const { t } = useLanguage();
    const status = googleUnlinked ? 'disconnected' : 'connected';

    return (
        <div className={`${shared.ConfigSection} ${shared.AnimateFadeIn}`}>
            <div className={shared.ConfigSection__header}>
                <span className={shared.ConfigSection__icon}><Icon name="calendar_today" /></span>
                <h2 className={shared.ConfigSection__title}>{t('google_calendar_title')}</h2>
            </div>

            <div className={shared.ConfigSection__body}>
                <div className={styles.IntegrationGoogleCalendar__group}>
                    <div className={styles.IntegrationGoogleCalendar__groupHeader}>
                        <div className={styles.IntegrationGoogleCalendar__statusInfo}>
                            <p className={styles.IntegrationGoogleCalendar__hint}>
                                {t('google_calendar_description')}
                            </p>
                            <StatusIndicator status={status} label={t('google_calendar_status', { status: t(status === 'connected' ? 'google_connected' : 'google_disconnected') })} />
                        </div>

                        {!googleUnlinked && (
                            <div className={styles.IntegrationGoogleCalendar__syncControls}>
                                <ConfigToggle
                                    id="google-sync-toggle"
                                    label={settings.google_sync_enabled === 'false' ? t('google_sync_paused') : t('google_sync_active')}
                                    checked={settings.google_sync_enabled !== 'false'}
                                    onChange={(val) => updateSetting('google_sync_enabled', val ? 'true' : 'false')}
                                />
                                <p className={styles.IntegrationGoogleCalendar__hintRight}>
                                    {t('google_sync_hint')}
                                </p>
                            </div>
                        )}
                    </div>

                    {!googleUnlinked ? (
                        <div className={styles.IntegrationGoogleCalendar__groupItems}>
                            <div className={styles.IntegrationGoogleCalendar__actions}>
                                <Button variant="secondary" onClick={onRefreshToken}>
                                    <Icon name="sync" />
                                    {t('google_refresh_link')}
                                </Button>
                                <Button variant="danger" onClick={onDisconnectGoogle}>
                                    <Icon name="close" />
                                    {t('google_disconnect_account')}
                                </Button>
                            </div>

                            <Alert variant="warning" title={t('google_sync_issues_title')}>
                                <p className={styles.IntegrationGoogleCalendar__alertMessage}>
                                    {t('google_sync_issues_message')}
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onRetryGoogle}
                                    disabled={loading}
                                    className={styles.IntegrationGoogleCalendar__actionsMt05}
                                >
                                    <Icon name="bolt" />
                                    {t('google_retry_failed')}
                                </Button>
                            </Alert>

                            <div className={shared.ConfigSection__divider}></div>

                            <div>
                                <ConfigField
                                    id="finance-spreadsheet-id"
                                    label={t('google_finance_spreadsheet_id')}
                                    value={settings.finance_spreadsheet_id || ''}
                                    onChange={(e) => updateSetting('finance_spreadsheet_id', e.target.value)}
                                    placeholder={t('google_spreadsheet_id_placeholder')}
                                    className={styles.IntegrationGoogleCalendar__inputMonospace}
                                    hint={t('google_spreadsheet_id_hint')}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.IntegrationGoogleCalendar__actions}>
                            <Button onClick={onGoogleAuth}>
                                {t('google_connect_workspaces')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
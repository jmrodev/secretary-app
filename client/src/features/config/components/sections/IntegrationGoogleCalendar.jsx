import React from 'react';
import shared from '@/styles/shared.module.css';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { StatusIndicator } from '@/components/atoms/StatusIndicator';
import { ConfigToggle } from '@/features/config/components/ui/ConfigToggle';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Alert } from '@/components/atoms/Alert';
import styles from './IntegrationGoogleCalendar.module.css';

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
    const status = googleUnlinked ? 'disconnected' : 'connected';
    const statusLabel = googleUnlinked ? 'Desconectado' : 'Conectado';

    return (
        <div className={`${shared.ConfigSection} ${shared.AnimateFadeIn}`}>
            <div className={shared.ConfigSection__header}>
                <span className={shared.ConfigSection__icon}><Icon name="calendar_today" /></span>
                <h2 className={shared.ConfigSection__title}>Integración con Google Calendar</h2>
            </div>

            <div className={shared.ConfigSection__body}>
                <div className={styles.IntegrationGoogleCalendar__group}>
                    <div className={styles.IntegrationGoogleCalendar__groupHeader}>
                        <div className={styles.IntegrationGoogleCalendar__statusInfo}>
                            <p className={styles.IntegrationGoogleCalendar__hint}>
                                Conecta tu cuenta de Google para sincronizar turnos automáticamente.
                            </p>
                            <StatusIndicator status={status} label={`Estado: ${statusLabel}`} />
                        </div>

                        {!googleUnlinked && (
                            <div className={styles.IntegrationGoogleCalendar__syncControls}>
                                <ConfigToggle
                                    id="google-sync-toggle"
                                    label={settings.google_sync_enabled === 'false' ? 'Sincronización PAUSADA' : 'Sincronización ACTIVA'}
                                    checked={settings.google_sync_enabled !== 'false'}
                                    onChange={(val) => updateSetting('google_sync_enabled', val ? 'true' : 'false')}
                                />
                                <p className={styles.IntegrationGoogleCalendar__hintRight}>
                                    Si pausas, los cambios en la App no se enviarán a Google.
                                </p>
                            </div>
                        )}
                    </div>

                    {!googleUnlinked ? (
                        <div className={styles.IntegrationGoogleCalendar__groupItems}>
                            <div className={styles.IntegrationGoogleCalendar__actions}>
                                <Button variant="secondary" onClick={onRefreshToken}>
                                    <Icon name="sync" className="mr-1" />
                                    Refrescar Enlace
                                </Button>
                                <Button variant="danger" onClick={onDisconnectGoogle}>
                                    <Icon name="close" className="mr-1" />
                                    Desconectar Cuenta
                                </Button>
                            </div>

                            <Alert variant="warning" title="¿Problemas de Sincronización?">
                                <p className={styles.IntegrationGoogleCalendar__alertMessage}>
                                    Si los turnos no se están enviando a Google, puede que haya elementos atascados.
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onRetryGoogle}
                                    disabled={loading}
                                    className={styles.IntegrationGoogleCalendar__actionsMt05}
                                >
                                    <Icon name="bolt" className="mr-1" />
                                    Reintentar Elementos Fallidos
                                </Button>
                            </Alert>

                            <div className={shared.ConfigSection__divider}></div>

                            <div>
                                <ConfigField
                                    id="finance-spreadsheet-id"
                                    label="Google Sheets - ID de Hoja de Cálculo (Finanzas)"
                                    value={settings.finance_spreadsheet_id || ''}
                                    onChange={(e) => updateSetting('finance_spreadsheet_id', e.target.value)}
                                    placeholder="e.g. 1aBCdEfGhIjKlMnOpQrStUvWxYz1234567890"
                                    className={styles.IntegrationGoogleCalendar__inputMonospace}
                                    hint={
                                        <>
                                            Pega el ID de la hoja de cálculo de Google donde deseas respaldar las transacciones.
                                            <br />
                                            <small>El ID se encuentra en la URL: docs.google.com/spreadsheets/d/<b>ID_AQUI</b>/edit</small>
                                        </>
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.IntegrationGoogleCalendar__actions}>
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


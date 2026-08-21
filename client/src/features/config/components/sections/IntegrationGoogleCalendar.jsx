import React from 'react';
import shared from '@/styles/shared.module.css';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { StatusIndicator } from '@/components/atoms/StatusIndicator';
import { ConfigToggle } from '@/features/config/components/ui/ConfigToggle';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import { Alert } from '@/components/atoms/Alert';

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
                <div className="config-group">
                    <div className="config-group__header config-group__header--flex-spaced">
                        <div className="config-group__status-info">
                            <p className="config-field__hint config-field__hint--mb-075">
                                Conecta tu cuenta de Google para sincronizar turnos automáticamente.
                            </p>
                            <StatusIndicator status={status} label={`Estado: ${statusLabel}`} />
                        </div>

                        {!googleUnlinked && (
                            <div className="config-group__sync-controls">
                                <ConfigToggle
                                    id="google-sync-toggle"
                                    label={settings.google_sync_enabled === 'false' ? 'Sincronización PAUSADA' : 'Sincronización ACTIVA'}
                                    checked={settings.google_sync_enabled !== 'false'}
                                    onChange={(val) => updateSetting('google_sync_enabled', val ? 'true' : 'false')}
                                />
                                <p className="config-field__hint config-field__hint--text-right">
                                    Si pausas, los cambios en la App no se enviarán a Google.
                                </p>
                            </div>
                        )}
                    </div>

                    {!googleUnlinked ? (
                        <div className="config-group__items">
                            <div className="config-actions">
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
                                <p className="config-alert__message">
                                    Si los turnos no se están enviando a Google, puede que haya elementos atascados.
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={onRetryGoogle}
                                    disabled={loading}
                                    className="config-actions--mt-05"
                                >
                                    <Icon name="bolt" className="mr-1" />
                                    Reintentar Elementos Fallidos
                                </Button>
                            </Alert>

                            <div className={shared.ConfigSection__divider}></div>

                            <div className="config-field">
                                <ConfigField
                                    id="finance-spreadsheet-id"
                                    label="Google Sheets - ID de Hoja de Cálculo (Finanzas)"
                                    value={settings.finance_spreadsheet_id || ''}
                                    onChange={(e) => updateSetting('finance_spreadsheet_id', e.target.value)}
                                    placeholder="e.g. 1aBCdEfGhIjKlMnOpQrStUvWxYz1234567890"
                                    className="config-field__input--monospace"
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


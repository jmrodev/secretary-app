import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import StatusIndicator from '@/components/atoms/StatusIndicator';
<<<<<<< HEAD
import ConfigToggle from '@/features/config/components/ConfigToggle';
import ConfigField from '@/features/config/components/ConfigField';
import Alert from '@/components/atoms/Alert';
import './IntegrationGoogleCalendar.css';
=======
import ConfigToggle from '@/components/molecules/ConfigToggle';
import ConfigField from '@/components/molecules/ConfigField';
import Alert from '@/components/atoms/Alert';
>>>>>>> main

/**
 * IntegrationGoogleCalendar Molecule.
 * Manages the connection to Google Calendar, sync status, and backup spreadsheets.
 */
const IntegrationGoogleCalendar = ({
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
<<<<<<< HEAD
                <Icon name="DATE_RANGE" className="config-section__icon" />
=======
                <span className="config-section__icon"><Icon name="calendar_today" /></span>
>>>>>>> main
                <h2 className="config-section__title">Integración con Google Calendar</h2>
            </div>

            <div className="config-section__body">
                <div className="config-group">
                    <div className="config-group__header config-group__header--flex-spaced">
                        <div>
                            <p className="config-field__hint config-field__hint--mb-075">
                                Conecta tu cuenta de Google para sincronizar turnos automáticamente.
                            </p>
                            <StatusIndicator status={status} label={`Estado: ${statusLabel}`} />
                        </div>

                        {!googleUnlinked && (
                            <div className="config-flex config-flex--column google-calendar-integration__status-container">
                                <ConfigToggle
                                    id="google-sync-toggle"
<<<<<<< HEAD
                                    label={
                                        <span className="config-field__label-with-icon">
                                            <Icon 
                                                name={settings.google_sync_enabled === 'false' ? 'CANCEL' : 'CONFIRMED'} 
                                                size="1rem" 
                                                className="config-field__label-icon"
                                            />
                                            {settings.google_sync_enabled === 'false' ? 'Sincronización PAUSADA' : 'Sincronización ACTIVA'}
                                        </span>
                                    }
=======
                                    label={settings.google_sync_enabled === 'false' ? 'Sincronización PAUSADA' : 'Sincronización ACTIVA'}
>>>>>>> main
                                    checked={settings.google_sync_enabled !== 'false'}
                                    onChange={(val) => updateSetting('google_sync_enabled', val ? 'true' : 'false')}
                                />
                                <p className="config-field__hint google-calendar-integration__hint--right">
                                    Si pausas, los cambios en la App no se enviarán a Google.
                                </p>
                            </div>
                        )}
                    </div>

                    {!googleUnlinked ? (
                        <div className="config-group__items">
                            <div className="config-actions">
<<<<<<< HEAD
                                <Button 
                                    variant="secondary" 
                                    onClick={onRefreshToken}
                                    icon={<Icon name="SYNC" />}
                                >
                                    Refrescar Enlace
                                </Button>
                                <Button 
                                    variant="danger" 
                                    onClick={onDisconnectGoogle}
                                    icon={<Icon name="CANCEL" />}
                                >
=======
                                <Button variant="secondary" onClick={onRefreshToken}>
                                    <Icon name="sync" className="mr-1" />
                                    Refrescar Enlace
                                </Button>
                                <Button variant="danger" onClick={onDisconnectGoogle}>
                                    <Icon name="close" className="mr-1" />
>>>>>>> main
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
                                    className="google-calendar-integration__retry-btn"
                                    icon={<Icon name="SYNC" />}
                                >
<<<<<<< HEAD
=======
                                    <Icon name="bolt" className="mr-1" />
>>>>>>> main
                                    Reintentar Elementos Fallidos
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

export default IntegrationGoogleCalendar;

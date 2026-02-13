import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import './DoctorGoogleSettings.css';

const DoctorGoogleSettings = ({
    connected,
    onConnect,
    onDisconnect,
    onVerifyCalendar,
    onImportContacts,
    onResetSpreadsheet
}) => {
    return (
        <div className="doctor-google-settings">
            <div className="doctor-google-settings__status-card">
                <div className="doctor-google-settings__info">
                    <h4 className="doctor-google-settings__title">Google Integration</h4>
                    <p className="doctor-google-settings__subtitle">Sincroniza calendar y contactos.</p>
                </div>
                <Badge variant={connected ? 'success' : 'secondary'}>
                    {connected ? '● CONECTADO' : '○ DESCONECTADO'}
                </Badge>
            </div>

            <div className="doctor-google-settings__actions">
                {!connected ? (
                    <>
                        <Button
                            variant="primary"
                            className="w-full"
                            size="lg"
                            onClick={onConnect}
                            icon="🔗"
                        >
                            Conectar Cuenta G-Suite
                        </Button>
                        <p className="doctor-google-settings__help-text">
                            * Asegúrate de estar logueado en la cuenta de Google del doctor en este navegador antes de conectar.
                        </p>
                    </>
                ) : (
                    <Button
                        variant="secondary"
                        className="w-full text-danger"
                        size="lg"
                        onClick={onDisconnect}
                        icon="❌"
                    >
                        Desvincular Cuenta
                    </Button>
                )}
            </div>

            {connected && (
                <div className="doctor-google-settings__tools">
                    <Button variant="secondary" onClick={onVerifyCalendar} icon="📅">
                        Verificar Turnos en Calendar
                    </Button>
                    <Button variant="primary" onClick={onImportContacts} icon="📥">
                        Sincronizar Contactos
                    </Button>
                    <div className="doctor-google-settings__divider" />
                    <div className="doctor-google-settings__reset-box">
                        <p className="doctor-google-settings__reset-notice">
                            ⚠️ ¿Problemas con la planilla? Si la borraste de Drive, usa este botón para que el sistema genere una nueva.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="doctor-google-settings__reset-btn"
                            onClick={onResetSpreadsheet}
                            icon="♻️"
                        >
                            Re-generar Planilla de Finanzas
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorGoogleSettings;

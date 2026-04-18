import React from 'react';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
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
                            className="doctor-google-settings__connect-btn"
                            size="lg"
                            onClick={onConnect}
<<<<<<< HEAD
                            icon="LINK"
=======
                            icon={<Icon name="link" />}
>>>>>>> main
                        >
                            Conectar Cuenta G-Suite
                        </Button>
                        <p className="doctor-google-settings__help-text">
                            * Asegúrate de estar logueado en la cuenta de Google del doctor en este navegador antes de conectar.
                        </p>
                    </>
                ) : (
                    <Button
                        variant="danger"
                        className="doctor-google-settings__disconnect-btn"
                        size="lg"
                        onClick={onDisconnect}
<<<<<<< HEAD
                        icon="CLOSE"
=======
                        icon={<Icon name="close" />}
>>>>>>> main
                    >
                        Desvincular Cuenta
                    </Button>
                )}
            </div>

            {connected && (
                <div className="doctor-google-settings__tools">
<<<<<<< HEAD
                    <Button variant="secondary" onClick={onVerifyCalendar} icon="APPOINTMENTS">
                        Verificar Turnos en Calendar
                    </Button>
                    <Button variant="primary" onClick={onImportContacts} icon="SYNC">
=======
                    <Button variant="secondary" onClick={onVerifyCalendar} icon={<Icon name="calendar_today" />}>
                        Verificar Turnos en Calendar
                    </Button>
                    <Button variant="primary" onClick={onImportContacts} icon={<Icon name="file_download" />}>
>>>>>>> main
                        Sincronizar Contactos
                    </Button>
                    <div className="doctor-google-settings__divider" />
                    <div className="doctor-google-settings__reset-box">
                        <p className="doctor-google-settings__reset-notice">
<<<<<<< HEAD
                            <Icon name="WARNING" size="sm" /> ¿Problemas con la planilla? Si la borraste de Drive, usa este botón para que el sistema genere una nueva.
=======
                            <Icon name="warning" size="1rem" className="mr-1" />¿Problemas con la planilla? Si la borraste de Drive, usa este botón para que el sistema genere una nueva.
>>>>>>> main
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="doctor-google-settings__reset-btn"
                            onClick={onResetSpreadsheet}
<<<<<<< HEAD
                            icon="RESTORE"
=======
                            icon={<Icon name="restore" />}
>>>>>>> main
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

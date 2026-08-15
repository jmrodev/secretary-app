import React from 'react';
import { Button } from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import styles from './DoctorGoogleSettings.module.css';

export const DoctorGoogleSettings = ({
    connected,
    onConnect,
    onDisconnect,
    onVerifyCalendar,
    onImportContacts,
    onResetSpreadsheet
}) => {
    return (
        <div className={`${styles.root}`}>
            <div className={`${styles.statusCard}`}>
                <div className={`${styles.info}`}>
                    <h4 className={`${styles.title}`}>Google Integration</h4>
                    <p className={`${styles.subtitle}`}>Sincroniza calendar y contactos.</p>
                </div>
                <Badge variant={connected ? 'success' : 'secondary'}>
                    {connected ? '● CONECTADO' : '○ DESCONECTADO'}
                </Badge>
            </div>

            <div className={`${styles.actions}`}>
                {!connected ? (
                    <>
                        <Button
                            variant="primary"
                            className="w-full"
                            size="lg"
                            onClick={onConnect}
                            icon={<Icon name="link" />}
                        >
                            Conectar Cuenta G-Suite
                        </Button>
                        <p className={`${styles.helpText}`}>
                            * Asegúrate de estar logueado en la cuenta de Google del doctor en este navegador antes de conectar.
                        </p>
                    </>
                ) : (
                    <Button
                        variant="secondary"
                        className="w-full text-danger"
                        size="lg"
                        onClick={onDisconnect}
                        icon={<Icon name="close" />}
                    >
                        Desvincular Cuenta
                    </Button>
                )}
            </div>

            {connected && (
                <div className={`${styles.tools}`}>
                    <Button variant="secondary" onClick={onVerifyCalendar} icon={<Icon name="calendar_today" />}>
                        Verificar Turnos en Calendar
                    </Button>
                    <Button variant="primary" onClick={onImportContacts} icon={<Icon name="file_download" />}>
                        Sincronizar Contactos
                    </Button>
                    <div className={`${styles.divider}`} />
                    <div className={`${styles.resetBox}`}>
                        <p className={`${styles.resetNotice}`}>
                            <Icon name="warning" size="1rem" className="mr-1" />¿Problemas con la planilla? Si la borraste de Drive, usa este botón para que el sistema genere una nueva.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${styles.resetBtn}`}
                            onClick={onResetSpreadsheet}
                            icon={<Icon name="restore" />}
                        >
                            Re-generar Planilla de Finanzas
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};



import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './DoctorGoogleSettings.module.css';

export const DoctorGoogleSettings = ({
    connected,
    onConnect,
    onDisconnect,
    onVerifyCalendar,
    onImportContacts,
    onResetSpreadsheet
}) => {
    const { t } = useLanguage();
    return (
        <div className={`${styles.DoctorGoogleSettings__root}`}>
            <div className={`${styles.DoctorGoogleSettings__statusCard}`}>
                <div className={`${styles.DoctorGoogleSettings__info}`}>
                    <h4 className={`${styles.DoctorGoogleSettings__title}`}>{t('google_integration')}</h4>
                    <p className={`${styles.DoctorGoogleSettings__subtitle}`}>{t('google_integration_subtitle')}</p>
                </div>
                <Badge variant={connected ? 'success' : 'secondary'}>
                    {connected ? `● ${t('connected_caps')}` : `○ ${t('disconnected_caps')}`}
                </Badge>
            </div>

            <div className={`${styles.DoctorGoogleSettings__actions}`}>
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
                        <p className={`${styles.DoctorGoogleSettings__helpText}`}>
                            * Asegúrate de estar logueado en la cuenta de Google del doctor en este navegador antes de conectar.
                        </p>
                    </>
                ) : (
                    <Button
                        variant="danger"
                        className="w-full"
                        size="lg"
                        onClick={onDisconnect}
                        icon={<Icon name="close" />}
                    >
                        Desvincular Cuenta
                    </Button>
                )}
            </div>

            {connected && (
                <div className={`${styles.DoctorGoogleSettings__tools}`}>
                    <Button variant="secondary" onClick={onVerifyCalendar} icon={<Icon name="calendar_today" />}>
                        Verificar Turnos en Calendar
                    </Button>
                    <Button variant="primary" onClick={onImportContacts} icon={<Icon name="file_download" />}>
                        Sincronizar Contactos
                    </Button>
                    <div className={`${styles.DoctorGoogleSettings__divider}`} />
                    <div className={`${styles.DoctorGoogleSettings__resetBox}`}>
                        <p className={`${styles.DoctorGoogleSettings__resetNotice}`}>
                            <Icon name="warning" size="1rem" />¿Problemas con la planilla? Si la borraste de Drive, usa este botón para que el sistema genere una nueva.
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${styles.DoctorGoogleSettings__resetBtn}`}
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



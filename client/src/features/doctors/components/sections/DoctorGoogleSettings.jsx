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
    onResetSpreadsheet,
    onHandover
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
                            {t('connect_gsuite')}
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full"
                            size="md"
                            onClick={onHandover}
                            icon={<Icon name="qr_code_scanner" />}
                        >
                            {t('link_via_phone')}
                        </Button>
                        <p className={`${styles.DoctorGoogleSettings__helpText}`}>
                            {t('gsuite_login_warning')}
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
                        {t('disconnect_account')}
                    </Button>
                )}
            </div>

            {connected && (
                <div className={`${styles.DoctorGoogleSettings__tools}`}>
                    <Button variant="secondary" onClick={onVerifyCalendar} icon={<Icon name="calendar_today" />}>
                        {t('verify_calendar_appointments')}
                    </Button>
                    <Button variant="primary" onClick={onImportContacts} icon={<Icon name="file_download" />}>
                        {t('sync_contacts')}
                    </Button>
                    <div className={`${styles.DoctorGoogleSettings__divider}`} />
                    <div className={`${styles.DoctorGoogleSettings__resetBox}`}>
                        <p className={`${styles.DoctorGoogleSettings__resetNotice}`}>
                            <Icon name="warning" size="1rem" />{t('spreadsheet_problems_notice')}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${styles.DoctorGoogleSettings__resetBtn}`}
                            onClick={onResetSpreadsheet}
                            icon={<Icon name="restore" />}
                        >
                            {t('regenerate_finance_spreadsheet')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

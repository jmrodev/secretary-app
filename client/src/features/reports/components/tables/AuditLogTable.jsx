import React from 'react';
import { Button } from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { formatDateTimeLong } from '@/utils/core/dateUtils';
import styles from './AuditLogTable.module.css';

export const AuditLogTable = React.memo(({ logs, onSelectLog, t }) => {

    const formatAction = (action) => {
        let variant = 'gray';

        if (action.includes('LOGIN')) variant = 'blue';
        if (action.includes('CREATE')) variant = 'green';
        if (action.includes('UPDATE')) variant = 'yellow';
        if (action.includes('DELETE')) variant = 'red';
        if (action.includes('ERROR')) variant = 'red';

        return <Badge variant={variant}>{action}</Badge>;
    };

    return (
        <div className={styles.AuditLogTable__auditLogTableContainer}>
            <table className={styles.AuditLogTable__root}>
                <thead className={styles.AuditLogTable__thead}>
                    <tr>
                        <th className={styles.AuditLogTable__th}>{t('time_header')}</th>
                        <th className={styles.AuditLogTable__th}>{t('user_header')}</th>
                        <th className={styles.AuditLogTable__th}>{t('action_header')}</th>
                        <th className={`${styles.AuditLogTable__th} ${styles.AuditLogTable__thDetails}`}>{t('details_header')}</th>
                        <th className={styles.AuditLogTable__th}>{t('ip_header')}</th>
                    </tr>
                </thead>
                <tbody className={styles.AuditLogTable__tbody}>
                    {logs.map(log => (
                        <tr key={log.id} className={styles.AuditLogTable__row}>
                            <td className={`${styles.AuditLogTable__cell} ${styles.AuditLogTable__cellTime}`}>
                                {formatDateTimeLong(log.created_at)}
                            </td>
                            <td className={`${styles.AuditLogTable__cell} ${styles.AuditLogTable__cellUser}`}>
                                {log.username}
                            </td>
                            <td className={styles.AuditLogTable__cell}>
                                {formatAction(log.action)}
                            </td>
                            <td className={`${styles.AuditLogTable__cell} ${styles.AuditLogTable__cellDetails}`} title={log.details}>
                                {log.details ? (
                                    log.details.length > 60 ? (
                                        <div className={styles.AuditLogTable__detailsWrapper}>
                                            <span className={styles.AuditLogTable__detailsText}>{log.details}</span>
                                            <Button
                                                variant="link"
                                                size="sm-compact"
                                                onClick={() => onSelectLog(log)}
                                            >
                                                {t('view_more')}
                                            </Button>
                                        </div>
                                    ) : <span className={styles.AuditLogTable__detailsText}>{log.details}</span>
                                ) : <span className={styles.AuditLogTable__detailsText}>-</span>}
                            </td>
                            <td className={`${styles.AuditLogTable__cell} ${styles.AuditLogTable__cellIp}`}>
                                {log.ip_address}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan="5" className={styles.AuditLogTable__empty}>{t('no_logs_found')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
});

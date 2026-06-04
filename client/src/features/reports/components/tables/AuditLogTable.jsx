import React from 'react';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { formatDateTimeLong } from '@/utils/core/dateUtils';
import styles from './AuditLogTable.module.css';

const AuditLogTable = ({ logs, onSelectLog, t }) => {

    const formatAction = (action) => {
        let variant = 'gray'; // Default badge variant

        if (action.includes('LOGIN')) variant = 'blue';
        if (action.includes('CREATE')) variant = 'green';
        if (action.includes('UPDATE')) variant = 'yellow';
        if (action.includes('DELETE')) variant = 'red';
        if (action.includes('ERROR')) variant = 'red';

        return <Badge variant={variant}>{action}</Badge>;
    };

    return (
        <div className={`${styles.auditLogTableContainer}`}>
            <table className={`${styles.root}`}>
                <thead className={`${styles.thead}`}>
                    <tr>
                        <th className={`${styles.th}`}>{t('time_header')}</th>
                        <th className={`${styles.th}`}>{t('user_header')}</th>
                        <th className={`${styles.th}`}>{t('action_header')}</th>
                        <th className={`${styles.th} ${styles.thDetails}`}>{t('details_header')}</th>
                        <th className={`${styles.th}`}>{t('ip_header')}</th>
                    </tr>
                </thead>
                <tbody className="audit-log-table__tbody">
                    {logs.map(log => (
                        <tr key={log.id} className={`${styles.row}`}>
                            <td className={`${styles.cell} ${styles.cellTime}`}>
                                {formatDateTimeLong(log.created_at)}
                            </td>
                            <td className={`${styles.cell} ${styles.cellUser}`}>
                                {log.username}
                            </td>
                            <td className={`${styles.cell}`}>
                                {formatAction(log.action)}
                            </td>
                            <td className={`${styles.cell} ${styles.cellDetails}`} title={log.details}>
                                {log.details ? (
                                    log.details.length > 60 ? (
                                        <div className={`${styles.detailsWrapper}`}>
                                            <span className={`${styles.detailsText}`}>{log.details}</span>
                                            <Button
                                                variant="link"
                                                size="sm-compact"
                                                onClick={() => onSelectLog(log)}
                                            >
                                                {t('view_more')}
                                            </Button>
                                        </div>
                                    ) : <span className={`${styles.detailsText}`}>{log.details}</span>
                                ) : <span className={`${styles.detailsText}`}>-</span>}
                            </td>
                            <td className={`${styles.cell} ${styles.cellIp}`}>
                                {log.ip_address}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan="5" className={`${styles.empty}`}>{t('no_logs_found')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(AuditLogTable);

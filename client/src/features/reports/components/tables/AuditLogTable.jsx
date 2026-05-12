import React from 'react';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { formatDateTimeLong } from '@/utils/core/dateUtils';
import './AuditLogTable.css';

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
        <div className="audit-log-table-container">
            <table className="audit-log-table">
                <thead className="audit-log-table__thead">
                    <tr>
                        <th className="audit-log-table__th">{t('time_header')}</th>
                        <th className="audit-log-table__th">{t('user_header')}</th>
                        <th className="audit-log-table__th">{t('action_header')}</th>
                        <th className="audit-log-table__th audit-log-table__th--details">{t('details_header')}</th>
                        <th className="audit-log-table__th">{t('ip_header')}</th>
                    </tr>
                </thead>
                <tbody className="audit-log-table__tbody">
                    {logs.map(log => (
                        <tr key={log.id} className="audit-log-table__row">
                            <td className="audit-log-table__cell audit-log-table__cell--time">
                                {formatDateTimeLong(log.created_at)}
                            </td>
                            <td className="audit-log-table__cell audit-log-table__cell--user">
                                {log.username}
                            </td>
                            <td className="audit-log-table__cell">
                                {formatAction(log.action)}
                            </td>
                            <td className="audit-log-table__cell audit-log-table__cell--details" title={log.details}>
                                {log.details ? (
                                    log.details.length > 60 ? (
                                        <div className="audit-log-table__details-wrapper">
                                            <span className="audit-log-table__details-text">{log.details}</span>
                                            <Button
                                                variant="link"
                                                size="sm-compact"
                                                onClick={() => onSelectLog(log)}
                                            >
                                                {t('view_more')}
                                            </Button>
                                        </div>
                                    ) : <span className="audit-log-table__details-text">{log.details}</span>
                                ) : <span className="audit-log-table__details-text">-</span>}
                            </td>
                            <td className="audit-log-table__cell audit-log-table__cell--ip">
                                {log.ip_address}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan="5" className="audit-log-table__empty">{t('no_logs_found')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(AuditLogTable);

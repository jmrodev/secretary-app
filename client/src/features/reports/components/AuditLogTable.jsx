import React from 'react';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';

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
        <div className="card table-responsive p-0 overflow-hidden shadow-sm">
            <table className="table-base table-base-lg w-full">
                <thead className="bg-slate-50">
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-main-500">
                        <th className="py-3 px-4">{t('time_header')}</th>
                        <th className="py-3 px-4">{t('user_header')}</th>
                        <th className="py-3 px-4">{t('action_header')}</th>
                        <th className="py-3 px-4 w-1/3">{t('details_header')}</th>
                        <th className="py-3 px-4">{t('ip_header')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-sm text-main-500 whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-main-700">
                                {log.username}
                            </td>
                            <td className="py-3 px-4">
                                {formatAction(log.action)}
                            </td>
                            <td className="py-3 px-4 text-sm max-w-xs truncate" title={log.details}>
                                {log.details ? (
                                    log.details.length > 60 ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-main-500 truncate block max-w-[200px]">{log.details}</span>
                                            <Button
                                                variant="link"
                                                size="sm-compact"
                                                onClick={() => onSelectLog(log)}
                                            >
                                                {t('view_more')}
                                            </Button>
                                        </div>
                                    ) : <span className="text-main-500">{log.details}</span>
                                ) : <span className="text-main-300">-</span>}
                            </td>
                            <td className="py-3 px-4 text-xs text-muted font-mono">
                                {log.ip_address}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-8 text-center text-muted">{t('no_logs_found')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(AuditLogTable);

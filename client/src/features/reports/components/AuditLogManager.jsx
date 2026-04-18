import React from 'react';
import AuditLogTable from '@/features/reports/components/AuditLogTable';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Modal from '@/components/molecules/Modal';
import { formatDate } from '@/utils/dateUtils';

const AuditLogManager = ({
    logs,
    selectedLog,
    setSelectedLog,
    t
}) => {

    const formatDetails = (detailsRaw) => {
        if (!detailsRaw) return <span className="text-muted">-</span>;

        let content = detailsRaw;
        let isJson = false;
        try {
            const parsed = JSON.parse(detailsRaw);
            if (typeof parsed === 'object' && parsed !== null) {
                content = parsed;
                isJson = true;
            }
        } catch (e) { /* Not JSON */ }

        if (isJson) {
            return (
                <div className="text-xs">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key} className="mb-1">
                            <span className="font-semibold text-slate-700">{key}:</span>{' '}
                            <span className="text-slate-600 break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span className="text-sm text-slate-600 break-all">{String(detailsRaw)}</span>;
    };

    return (
        <div className="audit-log-manager h-full flex flex-col">
            <header className="mb-6 border-b pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{t('audit_logs') || 'Registros de Auditoría'}</h2>
                        <p className="text-slate-500">Historial de acciones y seguridad del sistema.</p>
                    </div>
                    <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border">
                        {logs.length} {t('logs_count') || 'registros'}
                    </div>
                </div>
            </header>

            <div className="flex-1 dashboard-card dashboard-card--highlighted overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <AuditLogTable
                        logs={logs}
                        onSelectLog={setSelectedLog}
                        t={t}
                    />
                </div>
            </div>

            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title={t('log_details') || 'Detalle de Registro'}
                footer={
                    <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                        {t('close') || 'Cerrar'}
                    </Button>
                }
            >
                {selectedLog && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('action')}</div>
                                <div className="font-bold text-slate-800">{selectedLog.action}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('user')}</div>
                                <div className="font-medium text-slate-800">{selectedLog.username}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('date')}</div>
                                <div className="text-sm text-slate-600">{formatDate(selectedLog.created_at, { time: true })}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('ip_header')}</div>
                                <div className="text-sm font-mono text-slate-600">{selectedLog.ip_address}</div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="text-sm font-bold text-slate-700 mb-3">{t('details_header')}</h4>
                            <div className="bg-white p-4 rounded border border-slate-200 max-h-60 overflow-y-auto shadow-inner custom-scrollbar">
                                {formatDetails(selectedLog.details)}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AuditLogManager;

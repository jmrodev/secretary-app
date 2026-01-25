import React from 'react';
import Sidebar from '../components/organisms/Sidebar';
import Modal from '../components/molecules/Modal';
import Button from '../components/atoms/Button';
import AuditLogTable from '../components/organisms/AuditLogTable';
import { useAuditLogsController } from '../controllers/useAuditLogsController';

const AuditLogs = () => {
    const {
        logs, loading, selectedLog, setSelectedLog, user, t
    } = useAuditLogsController();

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
                            <span className="font-semibold text-main-700">{key}:</span>{' '}
                            <span className="text-main-600 break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span className="text-sm text-main-600 break-all">{String(detailsRaw)}</span>;
    };

    if (loading) return <div className="app-layout"><div className="loading-spinner m-auto"></div></div>;

    if (user.role !== 'admin') return <div className="app-layout"><main className="main-content text-center p-10">{t('access_denied')}</main></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h1 className="title">{t('audit_logs') || 'Registros de Auditoría'}</h1>
                        <p className="subtitle">Historial de acciones y seguridad del sistema.</p>
                    </div>

                    <AuditLogTable
                        logs={logs}
                        onSelectLog={setSelectedLog}
                        t={t}
                    />
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
                                    <div className="text-xs text-muted uppercase tracking-wider mb-1">{t('action')}</div>
                                    <div className="font-bold text-main-800">{selectedLog.action}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted uppercase tracking-wider mb-1">{t('user')}</div>
                                    <div className="font-medium text-main-800">{selectedLog.username}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted uppercase tracking-wider mb-1">{t('date')}</div>
                                    <div className="text-sm text-main-600">{new Date(selectedLog.created_at).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted uppercase tracking-wider mb-1">{t('ip_header')}</div>
                                    <div className="text-sm font-mono text-main-600">{selectedLog.ip_address}</div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-bold text-main-700 mb-3">{t('details_header')}</h4>
                                <div className="bg-white p-4 rounded border border-slate-200 max-h-60 overflow-y-auto shadow-inner custom-scrollbar">
                                    {formatDetails(selectedLog.details)}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </main>
        </div>
    );
};

export default AuditLogs;

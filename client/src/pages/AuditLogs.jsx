
import React from 'react';
import MainLayout from '../components/templates/MainLayout';
import Modal from '../components/molecules/Modal';
import Button from '../components/atoms/Button';
import Loading from '../components/atoms/Loading';
import Icon from '../components/atoms/Icon';
import { AuditLogTable, useAuditLogsController } from '../features/reports';
import { formatDate } from '../utils/dateUtils';

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
                            <span className="font-semibold text-slate-700">{key}:</span>{' '}
                            <span className="text-slate-600 break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return <span className="text-sm text-slate-600 break-all">{String(detailsRaw)}</span>;
    };

    if (loading) {
        return (
            <MainLayout wide>
                <div className="flex items-center justify-center p-20">
                    <Loading variant="centered" text={t('loading_logs') || "Cargando registros..."} />
                </div>
            </MainLayout>
        );
    }

    if (user.role !== 'admin') {
        return (
            <MainLayout wide>
                <div className="max-w-md mx-auto mt-20 p-8 bg-red-50 border border-red-100 rounded-xl text-center">
                    <Icon name="block" size="3rem" className="text-red-500 mb-4 mx-auto" />
                    <h2 className="text-red-800 font-bold text-xl mb-2">{t('access_denied')}</h2>
                    <p className="text-red-600">No tiene permisos para acceder a los registros de auditoría.</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout wide>
            <div className="audit-logs-page">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('audit_logs') || 'Registros de Auditoría'}</h1>
                    <p className="dashboard-header__subtitle">Historial de acciones y seguridad del sistema.</p>
                </header>

                <div className="dashboard-nav-bar animate-fadeIn">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Icon name="history_edu" size="1.2rem" />
                        {logs.length} {t('logs_count') || 'registros encontrados'}
                    </div>
                </div>

                <div className="dashboard-grid animate-fadeIn">

                    <main className="dashboard-main">
                        <div className="dashboard-card no-padding">
                            <AuditLogTable
                                logs={logs}
                                onSelectLog={setSelectedLog}
                                t={t}
                            />
                        </div>
                    </main>
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
        </MainLayout>
    );
};

export default AuditLogs;

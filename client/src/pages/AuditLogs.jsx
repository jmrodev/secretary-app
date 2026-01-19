import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';

const AuditLogs = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/logs');
                setLogs(res.data);
            } catch (err) {
                console.error("Failed to fetch logs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <div className="app-layout"><main className="main-content">{t('loading_logs')}</main></div>;

    const formatAction = (action) => {
        let color = 'chip-gray';
        let label = action;

        if (action.includes('LOGIN')) color = 'chip-blue';
        if (action.includes('CREATE')) color = 'chip-green';
        if (action.includes('UPDATE')) color = 'chip-yellow'; // Yellow text might be hard to read on light bg, checking CSS... yellow bg with dark gold text. Good.
        if (action.includes('DELETE')) color = 'chip-indigo'; // or red? css has chip-indigo. Let's use red style inline or add chip-red if needed. chip-danger isn't there? 
        // Actually, let's use custom class if needed or mapped ones.
        if (action.includes('DELETE')) return { color: 'bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold', label };
        if (action.includes('ERROR')) return { color: 'bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold', label };

        return { color: `status-chip ${color}`, label };
    };

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
        } catch (e) {
            // Not JSON
        }

        if (isJson) {
            return (
                <div className="text-xs">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key} className="mb-1">
                            <span className="font-semibold text-main-700">{key}:</span>{' '}
                            <span className="text-main-600">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                    ))}
                </div>
            );
        }

        return <span className="text-sm text-main-600">{String(detailsRaw)}</span>;
    };

    if (loading) return <div className="app-layout"><main className="main-content flex justify-center items-center h-full">{t('loading_logs')}</main></div>;

    if (user.role !== 'admin') return <div className="app-layout"><main className="main-content text-center p-10">{t('access_denied')}</main></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="w-full max-w-5xl">

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
                                {logs.map(log => {
                                    const actionStyle = formatAction(log.action);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-sm text-main-500 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-main-700">
                                                {log.username}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={actionStyle.color}>
                                                    {actionStyle.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm max-w-xs truncate" title={log.details}>
                                                {log.details ? (
                                                    log.details.length > 60 ? (
                                                        <span className="flex items-center gap-2">
                                                            <span className="text-main-500 truncate block max-w-[200px]">{log.details}</span>
                                                            <button
                                                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100"
                                                                onClick={() => setSelectedLog(log)}
                                                            >
                                                                View
                                                            </button>
                                                        </span>
                                                    ) : <span className="text-main-500">{log.details}</span>
                                                ) : <span className="text-main-300">-</span>}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-muted font-mono">
                                                {log.ip_address}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Modal */}
                <Modal
                    isOpen={!!selectedLog}
                    onClose={() => setSelectedLog(null)}
                    title={t('log_details') || 'Detalle de Registro'}
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
                                <div className="bg-white p-4 rounded border border-slate-200 max-h-60 overflow-y-auto shadow-inner">
                                    {formatDetails(selectedLog.details)}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="btn btn-secondary"
                                >
                                    {t('close') || 'Cerrar'}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            </main>
        </div>
    );
};

export default AuditLogs;

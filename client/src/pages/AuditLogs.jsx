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

    if (user.role !== 'admin') return <div className="app-layout"><main className="main-content">{t('access_denied')}</main></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <h1 className="title">{t('system_transaction_logs')}</h1>

                <div className="card table-responsive">
                    <table className="table-base table-base-lg">
                        <thead>
                            <tr className="border-b-2 text-left">
                                <th>{t('time_header')}</th>
                                <th>{t('user_header')}</th>
                                <th>{t('action_header')}</th>
                                <th>{t('details_header')}</th>
                                <th>{t('ip_header')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td className="whitespace-nowrap text-muted">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td>
                                        <strong>{log.username}</strong>
                                    </td>
                                    <td>
                                        <span className="status-chip chip-gray">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="text-sm">
                                        {log.details && log.details.length > 50 ? (
                                            <div>
                                                {log.details.substring(0, 50)}...
                                                <button
                                                    className="text-blue-500 hover:text-blue-700 ml-2 text-xs"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    {t('view_details') || 'Ver Detalle'}
                                                </button>
                                            </div>
                                        ) : log.details}
                                    </td>
                                    <td className="text-xs-gray">
                                        {log.ip_address}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Detail Modal */}
                <Modal
                    isOpen={!!selectedLog}
                    onClose={() => setSelectedLog(null)}
                    title={t('log_details') || 'Detalle de Registro'}
                >
                    {selectedLog && (
                        <div>
                            <div className="mb-4">
                                <strong>{t('action')}:</strong> {selectedLog.action}
                            </div>
                            <div className="mb-4">
                                <strong>{t('user')}:</strong> {selectedLog.username}
                            </div>
                            <div className="mb-4">
                                <strong>{t('date')}:</strong> {new Date(selectedLog.created_at).toLocaleString()}
                            </div>
                            <div className="p-4 bg-gray-50 rounded border">
                                <pre className="whitespace-pre-wrap font-inherit">
                                    {selectedLog.details}
                                </pre>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
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

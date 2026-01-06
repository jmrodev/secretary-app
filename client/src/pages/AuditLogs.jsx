import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/Sidebar';

const AuditLogs = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

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

                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>{t('time_header')}</th>
                                <th style={{ padding: '1rem' }}>{t('user_header')}</th>
                                <th style={{ padding: '1rem' }}>{t('action_header')}</th>
                                <th style={{ padding: '1rem' }}>{t('details_header')}</th>
                                <th style={{ padding: '1rem' }}>{t('ip_header')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: '#64748b' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <strong>{log.username}</strong>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: '#e2e8f0',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            color: '#1e293b'
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                        {log.details.length > 50 ? (
                                            <span title={log.details}>{log.details.substring(0, 50)}...</span>
                                        ) : log.details}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                                        {log.ip_address}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AuditLogs;

import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const useAuditLogsController = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await api.get('/logs');
            setLogs(res.data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user.role === 'admin') {
            fetchLogs();
        } else {
            setLoading(false);
        }
    }, [user.role]);

    return {
        logs,
        loading,
        selectedLog,
        setSelectedLog,
        user,
        t,
        fetchLogs
    };
};

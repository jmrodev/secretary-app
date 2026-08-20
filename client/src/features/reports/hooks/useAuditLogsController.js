import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/hooks/useLanguage';
import { useFetch } from '@/hooks/useFetch';

export const useAuditLogsController = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [selectedLog, setSelectedLog] = useState(null);

    const {
        data,
        loading,
        refetch: fetchLogs
    } = useFetch('/logs', {
        initialData: [],
        immediate: user?.role === 'admin'
    });

    // Normalize: server may return an error string or unexpected shape when
    // the logs table is empty/missing — always expose a real array.
    const logs = Array.isArray(data) ? data : [];

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

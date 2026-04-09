import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/context/LanguageContext';
import { useFetch } from '@/hooks/useFetch';

export const useAuditLogsController = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [selectedLog, setSelectedLog] = useState(null);

    const { 
        data: logs = [], 
        loading, 
        refetch: fetchLogs 
    } = useFetch('/logs', {
        initialData: [],
        immediate: user?.role === 'admin'
    });

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

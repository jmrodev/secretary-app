import { useMemo } from 'react';
import { useFetch } from '../../../hooks/useFetch';

export const useDashboardStats = (isStaff = false) => {
    // Stats Fetching
    const { data: stats = null, refetch: fetchStats } = useFetch('/users/stats');
    const { data: doctors = [] } = useFetch('/users/doctors', { initialData: [] });
    
    const { data: newPatientStats = null, refetch: fetchNewPatientStats } = useFetch('/users/patients/stats/new', {
        immediate: isStaff,
        initialData: { current_new: 0, currentDay: 0, currentWeek: 0, currentMonth: 0, currentYear: 0, lastYear: 0 }
    });

    const { data: requests = [], refetch: fetchRequests } = useFetch('/medical/requests', { initialData: [] });

    // Computed
    const pendingReqCount = useMemo(() => {
        return requests.filter(r => r.status === 'pending').length;
    }, [requests]);

    return {
        stats,
        newPatientStats,
        pendingReqCount,
        doctors,
        fetchStats,
        fetchDoctors: () => {}, // doctors are fetched automatically by useFetch
        fetchNewPatientStats,
        fetchRequests
    };
};


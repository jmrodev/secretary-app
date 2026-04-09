import { useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';

export const useDashboardStats = (isStaff = false) => {
    // Stats Fetching
    const { data: stats = null, refetch: fetchStats } = useFetch('/users/stats');
    const { data: doctors = [] } = useFetch('/users/doctors', { initialData: [] });
    
    const { data: newPatientStats = null, refetch: fetchNewPatientStats } = useFetch('/users/patients/stats/new', {
        immediate: isStaff,
        initialData: { current_new: 0, currentDay: 0, currentWeek: 0, currentMonth: 0, currentYear: 0, lastYear: 0 }
    });

    const { 
        data: requestsData = { requests: [], totalCount: 0 }, 
        refetch: fetchRequests 
    } = useFetch('/medical/requests', {
        initialData: { requests: [], totalCount: 0 },
        params: { status: ['pending', 'consult'] }
    });

    const requests = requestsData.requests || [];

    // Computed
    const pendingReqCount = requestsData.totalCount || 0;

    return {
        stats,
        newPatientStats,
        pendingReqCount: Number(pendingReqCount),
        doctors,
        fetchStats,
        fetchRequests,
        fetchNewPatientStats
    };
};


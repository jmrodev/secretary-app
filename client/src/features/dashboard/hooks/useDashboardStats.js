import { useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';

export const useDashboardStats = (isStaff = false, doctor_id = '') => {
    // Stats Fetching
    const statsHook = useFetch('/users/stats', {
        params: { doctor_id }
    });
    const {
        data: stats = null,
        loading: loadingStats,
        error: errorStats,
        refetch: fetchStats
    } = statsHook;

    const {
        data: doctorData,
        loading: loadingDoctors,
        error: errorDoctors
    } = useFetch('/users/doctors', { initialData: { doctors: [], totalCount: 0 } });

    const doctors = useMemo(() => doctorData?.doctors || [], [doctorData?.doctors]);
    
    const {
        data: newPatientStats = null,
        loading: loadingNewPatientStats,
        error: errorNewPatientStats,
        refetch: fetchNewPatientStats
    } = useFetch('/users/patients/stats/new', {
        immediate: isStaff,
        initialData: { current_new: 0, currentDay: 0, currentWeek: 0, currentMonth: 0, currentYear: 0, lastYear: 0 }
    });

    const requestsHook = useFetch('/medical/requests', {
        initialData: { requests: [], totalCount: 0 },
        params: { status: ['pending', 'consult'] }
    });
    const { 
        data: requestsData = { requests: [], totalCount: 0 }, 
        loading: loadingRequests,
        error: errorRequests,
        refetch: fetchRequests 
    } = requestsHook;


    // Computed
    const pendingReqCount = Number(requestsData.totalCount || 0);

    return useMemo(() => ({
        stats,
        newPatientStats,
        pendingReqCount,
        doctors,
        loadingStats,
        loadingDoctors,
        loadingNewPatientStats,
        loadingRequests,
        fetched: statsHook.fetched && requestsHook.fetched,
        fetchedDoctors: doctorData !== undefined && !loadingDoctors,
        errorStats,
        errorDoctors,
        errorNewPatientStats,
        errorRequests,
        fetchStats,
        fetchRequests,
        fetchNewPatientStats
    }), [
        stats, newPatientStats, pendingReqCount, doctors, 
        loadingStats, loadingDoctors, loadingNewPatientStats, loadingRequests,
        statsHook.fetched, requestsHook.fetched,
        doctorData,
        errorStats, errorDoctors, errorNewPatientStats, errorRequests,
        fetchStats, fetchRequests, fetchNewPatientStats
    ]);


};

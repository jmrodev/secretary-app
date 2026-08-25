import { useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';

/**
 * ECC-Pattern: useDashboardStats Hook
 * Orchestrates fetching and mapping of dashboard metrics.
 */
export const useDashboardStats = (isStaff = false, doctor_id = '') => {
    // 1. Core Appointments & Patient Stats
    const statsHook = useFetch('/users/stats', {
        params: { doctor_id },
        initialData: { success: true, data: {} }
    });
    
    // Map backend UserStatsService response to Dashboard structure
    const stats = useMemo(() => {
        const raw = statsHook.data?.data || {};
        return {
            appointments: {
                today: { count: raw.appointments_today || 0 },
                week: { count: raw.appointments_week || 0 },
                month: { count: raw.appointments_month || 0 },
                total: { count: raw.total_appointments || 0 }
            },
            total_patients: raw.total_patients || 0,
            total_contacts: raw.total_contacts || 0
        };
    }, [statsHook.data]);

    // 2. Finance Stats (For Cash Monitor)
    const finStatsHook = useFetch('/finances/stats', {
        params: { doctor_id: doctor_id || 'all' },
        initialData: { success: true, data: {} }
    });
    const financeStats = useMemo(() => finStatsHook.data?.data || {}, [finStatsHook.data]);

    // 3. New Patients Stats
    const newPatientsHook = useFetch('/users/patients/stats/new', {
        immediate: isStaff,
        initialData: { success: true, data: { currentDay: 0, currentWeek: 0, currentMonth: 0, currentYear: 0 } }
    });
    const newPatientStats = useMemo(() => newPatientsHook.data?.data || {}, [newPatientsHook.data]);

    // 4. Pending Requests Count
    const requestsHook = useFetch('/medical/requests', {
        initialData: { success: true, data: [], meta: { totalCount: 0 } },
        params: { status: ['pending', 'consult'], limit: 1 } // We only need the totalCount
    });
    const pendingReqCount = useMemo(() => Number(requestsHook.data?.meta?.totalCount || 0), [requestsHook.data]);

    const doctorsHook = useFetch('/users/doctors', { initialData: { success: true, data: [] } });
    const doctors = useMemo(() => doctorsHook.data?.data || [], [doctorsHook.data]);

    // Stable refetch callbacks so the returned memo doesn't capture the hook
    // objects (their identities change every render).
    const refetchStats = statsHook.refetch;
    const refetchFin = finStatsHook.refetch;
    const refetchNew = newPatientsHook.refetch;
    const refetchRequests = requestsHook.refetch;

    return useMemo(() => ({
        stats,
        financeStats,
        newPatientStats,
        pendingReqCount,
        doctors,
        loading: statsHook.loading || finStatsHook.loading || newPatientsHook.loading,
        error: statsHook.error || finStatsHook.error || newPatientsHook.error,
        fetched: statsHook.fetched && finStatsHook.fetched && doctorsHook.fetched,
        refetch: () => {
            refetchStats();
            refetchFin();
            if (isStaff) refetchNew();
            refetchRequests();
        }
    }), [
        stats, financeStats, newPatientStats, pendingReqCount, doctors,
        statsHook.loading, finStatsHook.loading, newPatientsHook.loading,
        statsHook.error, finStatsHook.error, newPatientsHook.error,
        statsHook.fetched, finStatsHook.fetched, doctorsHook.fetched,
        refetchStats, refetchFin, refetchNew, refetchRequests, isStaff
    ]);
};

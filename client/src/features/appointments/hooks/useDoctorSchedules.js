import { useFetch } from '@/hooks/useFetch';

/**
 * useDoctorSchedules (Handler Hook).
 * Manages fetching of doctor's working hours/blocks from the local database.
 * This is independent of Google Calendar.
 * 
 * @param {number|string} doctorId - The ID of the doctor to fetch schedules for.
 * @returns {Object} { doctorSchedule, loading, refetch }
 */
export const useDoctorSchedules = (doctorId) => {
    const { 
        data: doctorSchedule = [],
        loading,
        refetch
    } = useFetch(doctorId ? `/schedules/${doctorId}` : null, {
        initialData: [],
        immediate: !!doctorId,
        dependencies: [doctorId]
    });

    return { 
        doctorSchedule, 
        loading, 
        refetch 
    };
};

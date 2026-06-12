import { useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { createDate } from '@/utils/core/dateUtils';

const EMPTY_ARRAY = [];

/**
 * ECC-Pattern: Server-Side Daily Schedule Controller
 * Optimizes fetching by requesting only the selected day from the server.
 */
export const useDayScheduleController = (date, doctor) => {
    // Convert date to string format for fetch
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Fetch SQL-First daily schedule using the ECC-compliant endpoint
    const { data: response, loading, refetch } = useFetch('/appointments/daily-schedule', {
        params: { doctorId: doctor?.id, date: dateStr },
        immediate: !!doctor?.id,
        initialData: { success: true, data: [] }
    });

    const rawSlots = response?.data || EMPTY_ARRAY;

    // Group the SQL rows into timeSlots
    const timeSlots = useMemo(() => {
        if (!rawSlots || rawSlots.length === 0) return [];
        
        const slotsMap = new Map();
        
        rawSlots.forEach(row => {
            const timeStr = row.slot_time;
            if (!timeStr) return;
            if (!slotsMap.has(timeStr)) {
                const [h, m] = timeStr.split(':').map(Number);
                const slotDate = createDate(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
                
                slotsMap.set(timeStr, {
                    time: slotDate,
                    type: row.slot_status === 'closed_holiday' ? 'closed' : 
                          row.slot_status === 'break' ? 'closed' : 
                          row.slot_status === 'out_of_hours' ? 'closed' : 'regular',
                    duration: (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60,
                    slotApps: [],
                    isBlockedByGoogle: row.slot_status === 'blocked'
                });
            }
            
            if (row.id) {
                slotsMap.get(timeStr).slotApps.push(row);
            }
        });
        
        return Array.from(slotsMap.values()).sort((a, b) => a.time.getTime() - b.time.getTime());
    }, [rawSlots, date, doctor]);

    return { timeSlots, loading, refetch };
};

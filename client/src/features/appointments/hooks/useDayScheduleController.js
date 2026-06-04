import { useMemo, useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { createDate } from '@/utils/core/dateUtils';

const EMPTY_ARRAY = [];

export const useDayScheduleController = (date, doctor, schedule, appointments, showOutOfHours) => {
    const overturnStart = doctor?.overturn_start_time || '08:00';
    const overturnEnd = doctor?.overturn_end_time || '21:00';

    const parseTime = (timeStr, baseDate) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        return createDate(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m);
    };

    let startLimit = createDate(date.getFullYear(), date.getMonth(), date.getDate(), 8);
    let endLimit = createDate(date.getFullYear(), date.getMonth(), date.getDate(), 21);

    if (showOutOfHours) {
        const oStart = parseTime(overturnStart, date);
        const oEnd = parseTime(overturnEnd, date);
        if (oStart < startLimit) startLimit = oStart;
        if (oEnd > endLimit) endLimit = oEnd;
        const sevenAM = createDate(date.getFullYear(), date.getMonth(), date.getDate(), 7);
        if (startLimit > sevenAM) startLimit = sevenAM;
    }

    if (schedule) {
        schedule.forEach(s => {
            const bStart = parseTime(s.start_time, date); const bEnd = parseTime(s.end_time, date);
            if (bStart < startLimit) startLimit = bStart; if (bEnd > endLimit) endLimit = bEnd;
        });
    }

    const duration = (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60;
    
    // Convert date to string format for fetch
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Fetch SQL-First daily schedule
    const { data: rawSlots = EMPTY_ARRAY, loading, refetch } = useFetch('/appointments/daily-schedule', {
        params: { doctorId: doctor?.id, date: dateStr },
        immediate: !!doctor?.id,
        initialData: EMPTY_ARRAY
    });

    // Sync with parent appointments (refetch if global list changes)
    useEffect(() => {
        refetch();
    }, [appointments, refetch]);

    // Group the SQL rows into timeSlots
    const timeSlots = useMemo(() => {
        if (!rawSlots || rawSlots.length === 0) return [];
        
        const slotsMap = new Map();
        
        rawSlots.forEach(row => {
            const timeStr = row.slot_time;
            if (!timeStr) return;
            if (!slotsMap.has(timeStr)) {
                // Parse time to Date object for the UI
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
            
            // If there's an appointment in this row, add it
            if (row.id) {
                slotsMap.get(timeStr).slotApps.push(row);
            }
        });
        
        return Array.from(slotsMap.values()).sort((a, b) => a.time.getTime() - b.time.getTime());
    }, [rawSlots, date, doctor]);

    return { timeSlots, loading };
};

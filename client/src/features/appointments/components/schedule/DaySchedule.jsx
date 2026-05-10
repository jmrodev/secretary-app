import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDayScheduleHandlers } from '@/features/appointments/hooks/useDayScheduleHandlers';
import { isSameDay } from '@/utils/core/dateUtils';
import { useFetch } from '@/hooks/useFetch';

import DayScheduleHeader from '@/features/appointments/components/DayScheduleHeader.jsx';
import ScheduleTimeline from '@/features/appointments/components/ScheduleTimeline.jsx';

import './DaySchedule.css';

/**
 * DaySchedule (Executor Component).
 * Orchestrates the display of daily appointments, time slots, and schedule navigation.
 */
const DaySchedule = ({
    date, appointments, onSlotClick, doctor, schedule, onDateSelect,
    holidays = [], showOutOfHours, setShowOutOfHours, onNextFreeSlot
}) => {
    const { t } = useLanguage();
    const [showCancelled, setShowCancelled] = React.useState(false);

    const { handlePrint, handlePrevDay, handleNextDay, handleToday, handleSlotAction } = useDayScheduleHandlers({
        date, appointments, doctor, onDateSelect, onSlotClick, showCancelled
    });

    const overturnStart = doctor?.overturn_start_time || '08:00';
    const overturnEnd = doctor?.overturn_end_time || '21:00';

    const dateStr = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const holiday = holidays && holidays.find(h => h.date.startsWith(dateStr));
    let daysConfig = holiday ? [] : (schedule || []).filter(s => s.day_of_week === date.getDay() && s.is_break === 0);

    const dayApps = React.useMemo(() => {
        return [...appointments]
            .filter(appt => isSameDay(appt.appointment_date, date))
            .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
    }, [appointments, date]);

    const parseTime = (timeStr, baseDate) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(baseDate); d.setHours(h, m, 0, 0); return d;
    };

    let startLimit = new Date(date); startLimit.setHours(8, 0, 0, 0);
    let endLimit = new Date(date); endLimit.setHours(21, 0, 0, 0);

    if (showOutOfHours) {
        const oStart = parseTime(overturnStart, date);
        const oEnd = parseTime(overturnEnd, date);
        if (oStart < startLimit) startLimit = oStart;
        if (oEnd > endLimit) endLimit = oEnd;
        const sevenAM = new Date(date); sevenAM.setHours(7, 0, 0, 0);
        if (startLimit > sevenAM) startLimit = sevenAM;
    }

    if (schedule) {
        schedule.forEach(s => {
            const bStart = parseTime(s.start_time, date); const bEnd = parseTime(s.end_time, date);
            if (bStart < startLimit) startLimit = bStart; if (bEnd > endLimit) endLimit = bEnd;
        });
    }

    const duration = (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60;
    if (dayApps.length > 0) {
        dayApps.forEach(a => {
            const aStart = new Date(a.appointment_date); const aEnd = new Date(aStart.getTime() + duration * 60000);
            if (aStart < startLimit) startLimit = aStart; if (aEnd > endLimit) endLimit = aEnd;
        });
    }

    // Fetch SQL-First daily schedule
    const { data: rawSlots = [], loading, refetch } = useFetch('/appointments/daily-schedule', {
        params: { doctorId: doctor?.id, date: dateStr },
        initialData: []
    });

    // Sync with parent appointments (refetch if global list changes)
    React.useEffect(() => {
        refetch();
    }, [appointments, refetch]);

    // Group the SQL rows into timeSlots
    const timeSlots = React.useMemo(() => {
        if (!rawSlots || rawSlots.length === 0) return [];
        
        const slotsMap = new Map();
        
        rawSlots.forEach(row => {
            const timeStr = row.slot_time;
            if (!slotsMap.has(timeStr)) {
                // Parse time to Date object for the UI
                const [h, m, s] = timeStr.split(':').map(Number);
                const slotDate = new Date(date);
                slotDate.setHours(h, m, 0, 0);
                
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

    // Provide the pre-grouped appointments to ScheduleTimeline
    const getAppointmentsForSlot = (slotTime) => {
        const timeStr = slotTime.toTimeString().split(' ')[0]; // "08:00:00"
        const slot = timeSlots.find(s => s.time.toTimeString().split(' ')[0] === timeStr);
        return slot ? slot.slotApps : [];
    };

    if (loading) {
        return <div className="day-schedule"><div className="day-schedule__loading">Cargando agenda...</div></div>;
    }

    return (
        <div className="day-schedule">
            <DayScheduleHeader
                date={date} holiday={null} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                showCancelled={showCancelled} setShowCancelled={setShowCancelled}
                onPrevDay={handlePrevDay} onToday={handleToday} onNextDay={handleNextDay} onPrint={handlePrint}
                onNextFreeSlot={onNextFreeSlot}
                t={t}
            />
            <ScheduleTimeline
                timeSlots={timeSlots} showOutOfHours={showOutOfHours} showCancelled={showCancelled}
                onSlotClick={onSlotClick} onSlotAction={handleSlotAction} getAppointmentsForSlot={getAppointmentsForSlot} t={t}
            />
        </div>
    );
};

export default DaySchedule;

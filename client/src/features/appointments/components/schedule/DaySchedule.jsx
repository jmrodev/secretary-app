import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDayScheduleHandlers } from '@/features/appointments/hooks/useDayScheduleHandlers';
import { isSameDay, compareDates, parseDate, createDate, toInputDate } from '@/utils/core/dateUtils';
import { useFetch } from '@/hooks/useFetch';
import Loading from '@/components/atoms/Loading';

import DayScheduleHeader from './DayScheduleHeader.jsx';
import ScheduleTimeline from './ScheduleTimeline.jsx';

import './DaySchedule.css';

const EMPTY_ARRAY = [];

/**
 * DaySchedule (Executor Component).
 * Orchestrates the display of daily appointments, time slots, and schedule navigation.
 */
const DaySchedule = ({
    date, appointments, onSlotClick, doctor, schedule, onDateSelect,
    holidays = EMPTY_ARRAY, showOutOfHours, setShowOutOfHours, onNextFreeSlot
}) => {
    const { t } = useLanguage();
    const [showCancelled, setShowCancelled] = React.useState(false);

    const { handlePrint, handlePrevDay, handleNextDay, handleToday, handleSlotAction } = useDayScheduleHandlers({
        date, appointments, doctor, onDateSelect, onSlotClick, showCancelled
    });

    const overturnStart = doctor?.overturn_start_time || '08:00';
    const overturnEnd = doctor?.overturn_end_time || '21:00';

    const dateStr = toInputDate(date);

    const dayApps = React.useMemo(() => {
        return [...appointments]
            .filter(appt => isSameDay(appt.appointment_date, date))
            .sort((a, b) => compareDates(a.appointment_date, b.appointment_date));
    }, [appointments, date]);

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
    if (dayApps.length > 0) {
        dayApps.forEach(a => {
            const aStart = parseDate(a.appointment_date); const aEnd = parseDate(aStart.getTime() + duration * 60000);
            if (aStart < startLimit) startLimit = aStart; if (aEnd > endLimit) endLimit = aEnd;
        });
    }

    // Fetch SQL-First daily schedule
    const { data: rawSlots = EMPTY_ARRAY, loading, refetch } = useFetch('/appointments/daily-schedule', {
        params: { doctorId: doctor?.id, date: dateStr },
        initialData: EMPTY_ARRAY
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

    // Provide the pre-grouped appointments to ScheduleTimeline
    const getAppointmentsForSlot = (slotTime) => {
        const timeStr = slotTime.toTimeString().split(' ')[0]; // "08:00:00"
        const found = timeSlots.find(slot => slot.time.toTimeString().split(' ')[0] === timeStr);
        return found ? found.slotApps : [];
    };

    if (loading) {
        return (
            <div className="day-schedule">
                <Loading variant="centered" text={t('loading')} />
            </div>
        );
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

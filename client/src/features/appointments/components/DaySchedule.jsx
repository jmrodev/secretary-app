import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDayScheduleHandlers } from '@/features/appointments/hooks/useDayScheduleHandlers';
import { isSameDay } from '@/utils/dateUtils';

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

    const timeSlots = [];
    let currentTime = new Date(startLimit);
    const endTime = new Date(endLimit);

    while (currentTime < endTime) {
        const timeStr = currentTime.toTimeString().split(' ')[0];
        let type = 'regular';
        let currentBlock = null;
        let nextBlock = null;

        if (holiday) { type = 'closed'; }
        else if (daysConfig.length > 0) {
            currentBlock = daysConfig.find(block => timeStr >= block.start_time && timeStr < block.end_time);
            nextBlock = daysConfig.filter(b => b.start_time > timeStr).sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
            if (!currentBlock) type = 'closed';
        } else {
            if (timeStr < overturnStart || timeStr >= overturnEnd) type = 'closed';
        }

        const slotStart = new Date(currentTime);
        let slotDuration = duration;

        if (type === 'closed' && nextBlock) {
            const [nh, nm] = nextBlock.start_time.split(':');
            const nextStartTime = new Date(currentTime); nextStartTime.setHours(nh, nm, 0, 0);
            const diffMin = (nextStartTime.getTime() - currentTime.getTime()) / 60000;
            if (diffMin > 0 && diffMin < slotDuration) slotDuration = diffMin;
        }

        const blockForce = currentBlock ? (currentBlock.force_hour_alignment === 1) : doctor?.force_hour_alignment;
        if (blockForce && slotStart.getMinutes() !== 0) slotDuration = 60 - slotStart.getMinutes();

        if (currentBlock) {
            const [eh, em] = currentBlock.end_time.split(':');
            const blockEndTime = new Date(currentTime); blockEndTime.setHours(eh, em, 0, 0);
            const remainingMin = (blockEndTime.getTime() - currentTime.getTime()) / 60000;
            if (remainingMin > 0 && remainingMin < slotDuration) slotDuration = remainingMin;
        }

        if (slotDuration <= 0) slotDuration = 15;
        timeSlots.push({ time: slotStart, type: type, duration: slotDuration });
        currentTime = new Date(slotStart.getTime() + slotDuration * 60000);
    }

    const getAppointmentsForSlot = (slotTime, durationMinutes) => {
        return dayApps.filter(appt => {
            const apptStart = new Date(appt.appointment_date).getTime();
            const slotStart = slotTime.getTime();
            const slotEnd = slotStart + durationMinutes * 60000;
            return apptStart >= slotStart && apptStart < slotEnd;
        });
    };

    return (
        <div className="day-schedule">
            <DayScheduleHeader
                date={date} holiday={holiday} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
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

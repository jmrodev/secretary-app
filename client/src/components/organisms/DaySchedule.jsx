import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useDayScheduleHandlers } from '../../hooks/useDayScheduleHandlers';
import { useConfig } from '../../context/ConfigContext';

// Molecules
import DayScheduleHeader from '../molecules/DayScheduleHeader';
import ScheduleTimeline from '../molecules/ScheduleTimeline';

import './DaySchedule.css';

/**
 * DaySchedule Organism.
 * Orchestrates the display of daily appointments, time slots, and schedule navigation.
 */
const DaySchedule = ({
    date, appointments, onSlotClick, doctor, schedule, onDateSelect,
    holidays = [], showOutOfHours, setShowOutOfHours
}) => {
    const { t } = useLanguage();
    const { settings } = useConfig();
    const [showCancelled, setShowCancelled] = React.useState(false);

    const {
        handlePrint,
        handlePrevDay,
        handleNextDay,
        handleToday,
        handleSlotAction
    } = useDayScheduleHandlers({
        date,
        appointments,
        doctor,
        onDateSelect,
        onSlotClick,
        showCancelled
    });

    const overturnStart = doctor?.overturn_start_time || '08:00';
    const overturnEnd = doctor?.overturn_end_time || '21:00';

    const dateStr = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const holiday = holidays && holidays.find(h => h.date.startsWith(dateStr));

    let daysConfig = holiday ? [] : (schedule || []).filter(s => s.day_of_week === date.getDay() && s.is_break === 0);

    const dayApps = appointments.filter(appt => {
        const d = new Date(appt.appointment_date);
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });

    // Precise calculation of bounds
    const parseTime = (timeStr, baseDate) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(baseDate);
        d.setHours(h, m, 0, 0);
        return d;
    };

    let startLimit = new Date(date);
    startLimit.setHours(8, 0, 0, 0);

    let endLimit = new Date(date);
    endLimit.setHours(21, 0, 0, 0);

    // If showing out of hours, try to snap to the EXACT minute of the overturn start
    const oStart = parseTime(overturnStart, date);
    const oEnd = parseTime(overturnEnd, date);

    if (showOutOfHours) {
        startLimit = oStart;
        endLimit = oEnd;
    }

    // Expand if there are earlier/later blocks or appointments
    if (schedule && schedule.length > 0) {
        schedule.forEach(s => {
            const bStart = parseTime(s.start_time, date);
            const bEnd = parseTime(s.end_time, date);
            if (bStart < startLimit) startLimit = bStart;
            if (bEnd > endLimit) endLimit = bEnd;
        });
    }

    const duration = (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60;

    if (dayApps.length > 0) {
        dayApps.forEach(a => {
            const aStart = new Date(a.appointment_date);
            const aEnd = new Date(aStart.getTime() + duration * 60000);
            if (aStart < startLimit) startLimit = aStart;
            if (aEnd > endLimit) endLimit = aEnd;
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

        if (holiday) {
            type = 'closed';
        } else if (daysConfig.length > 0) {
            currentBlock = daysConfig.find(block => {
                return timeStr >= block.start_time && timeStr < block.end_time;
            });

            // Find if a block starts after current time but before we'd finish a full duration
            nextBlock = daysConfig
                .filter(b => b.start_time > timeStr)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

            if (!currentBlock) type = 'closed';
        } else {
            if (timeStr < overturnStart || timeStr >= overturnEnd) type = 'closed';
        }

        const slotStart = new Date(currentTime);
        let slotDuration = duration;

        // 1. If we are in a gap (closed) and a block starts soon, snap to it
        if (type === 'closed' && nextBlock) {
            const [nh, nm] = nextBlock.start_time.split(':');
            const nextStartTime = new Date(currentTime);
            nextStartTime.setHours(nh, nm, 0, 0);
            const diffMin = (nextStartTime.getTime() - currentTime.getTime()) / 60000;
            if (diffMin > 0 && diffMin < slotDuration) {
                slotDuration = diffMin;
            }
        }

        // 2. Determine if we should force alignment based on block setting or doctor setting
        const blockForce = currentBlock ? (currentBlock.force_hour_alignment === 1) : doctor?.force_hour_alignment;

        if (blockForce && slotStart.getMinutes() !== 0) {
            slotDuration = 60 - slotStart.getMinutes();
        }

        // 3. Ensure we don't overflow the current block's end
        if (currentBlock) {
            const [eh, em] = currentBlock.end_time.split(':');
            const blockEndTime = new Date(currentTime);
            blockEndTime.setHours(eh, em, 0, 0);
            const remainingMin = (blockEndTime.getTime() - currentTime.getTime()) / 60000;
            if (remainingMin > 0 && remainingMin < slotDuration) {
                slotDuration = remainingMin;
            }
        }

        // Avoid infinite loops/zero duration
        if (slotDuration <= 0) slotDuration = 15;

        timeSlots.push({
            time: slotStart,
            type: type,
            duration: slotDuration
        });

        currentTime = new Date(slotStart.getTime() + slotDuration * 60000);
    }

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getAppointmentsForSlot = (slotTime, durationMinutes) => {
        return appointments.filter(appt => {
            const apptDate = new Date(appt.appointment_date);
            if (!isSameDay(apptDate, date)) return false;

            const slotStart = slotTime.getTime();
            const slotEnd = slotStart + durationMinutes * 60000;
            const apptStart = apptDate.getTime();

            return apptStart >= slotStart && apptStart < slotEnd;
        });
    };

    return (
        <div className="day-schedule">
            <DayScheduleHeader
                date={date}
                holiday={holiday}
                showOutOfHours={showOutOfHours}
                setShowOutOfHours={setShowOutOfHours}
                showCancelled={showCancelled}
                setShowCancelled={setShowCancelled}
                onPrevDay={handlePrevDay}
                onToday={handleToday}
                onNextDay={handleNextDay}
                onPrint={handlePrint}
                t={t}
            />

            <ScheduleTimeline
                timeSlots={timeSlots}
                showOutOfHours={showOutOfHours}
                showCancelled={showCancelled}
                onSlotClick={onSlotClick}
                onSlotAction={handleSlotAction}
                getAppointmentsForSlot={getAppointmentsForSlot}
                t={t}
            />
        </div>
    );
};

export default DaySchedule;

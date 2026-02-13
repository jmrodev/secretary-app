import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext'; // Keep just in case or remove if truly unused?
// Actually I should remove useModal from consumption if I removed it.
import { useDayScheduleHandlers } from '../../hooks/useDayScheduleHandlers';
import { useConfig } from '../../context/ConfigContext';
import AppointmentCard from '../molecules/AppointmentCard';
import Button from '../atoms/Button';
import Switch from '../atoms/Switch';
import { formatDate, formatTime } from '../../utils/dateUtils';
import './DaySchedule.css';

const DaySchedule = ({
    date, appointments, onSlotClick, doctor, schedule, onDateSelect,
    holidays = [], showOutOfHours, setShowOutOfHours
}) => {
    const { t } = useLanguage();
    // const { confirm } = useModal(); // Moved to hook
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
            <header className="day-schedule__header">
                <div className="day-schedule__title-group">
                    <h3 className="day-schedule__title">
                        {formatDate(date, { weekday: true, monthName: true, hideYear: true })}
                    </h3>
                    {holiday && (
                        <span className="day-schedule__holiday-badge">
                            🏖️ {holiday.description}
                        </span>
                    )}
                </div>

                <div className="day-schedule__nav">
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={handlePrevDay}
                        title={t('prev_day') || "Día Anterior"}
                    >
                        ⬅️
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={handleToday}
                        className="day-schedule__today-btn"
                        title={t('today') || "Hoy"}
                    >
                        {t('today') || "Hoy"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={handleNextDay}
                        title={t('next_day') || "Día Siguiente"}
                    >
                        ➡️
                    </Button>
                </div>

                <div className="day-schedule__toolbar">
                    <div className="day-schedule__controls">
                        <Switch
                            label={t('show_out_of_hours') || 'Mostrar fuera de horario'}
                            checked={showOutOfHours}
                            onChange={setShowOutOfHours}
                        />
                        <Switch
                            label={t('show_cancelled') || 'Mostrar Cancelados'}
                            checked={showCancelled}
                            onChange={setShowCancelled}
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={handlePrint}
                        className="day-schedule__print-btn"
                        title={t('print_list_tooltip') || "Imprimir lista del día"}
                        icon="🖨️"
                    >
                        {t('print') || 'Imprimir'}
                    </Button>
                </div>
            </header>

            <div className="schedule-timeline">
                {timeSlots
                    .map(slot => ({
                        ...slot,
                        slotApps: getAppointmentsForSlot(slot.time, slot.duration)
                    }))
                    .filter(slot => {
                        if (showOutOfHours) return true;
                        if (slot.type !== 'closed') return true;
                        return slot.slotApps.length > 0;
                    })
                    .map((slot, index) => {
                        const { slotApps, type } = slot;
                        const isSlotClosed = type === 'closed';
                        const isSlotBreak = type === 'break';
                        const isBlocked = slotApps.some(a => !['cancelled', 'suspended', 'absent'].includes(a.status));

                        const slotClasses = `time-slot ${isSlotClosed ? 'time-slot--closed' : ''} ${isSlotBreak ? 'time-slot--break' : ''}`;

                        return (
                            <div key={index} className={slotClasses}>
                                <div className="slot-content">
                                    {slotApps
                                        .filter(appt => showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status))
                                        .map(appt => (
                                            <AppointmentCard
                                                key={appt.id}
                                                appt={appt}
                                                onClick={() => onSlotClick(slot.time.getHours(), appt)}
                                            />
                                        ))}

                                    {!isBlocked && (
                                        <div
                                            className={`available-slot ${isSlotClosed ? 'available-slot--closed' : ''}`}
                                            onClick={() => handleSlotAction(slot)}
                                        >
                                            <span className="available-slot__icon">{isSlotClosed ? '🚫' : '+'}</span>
                                            <div className="available-slot__info">
                                                <span className="available-slot__time">
                                                    {formatTime(slot.time)}
                                                </span>
                                                <span className="available-slot__label">
                                                    {isSlotClosed ? (t('closed_hours') || 'Fuera de Horario') : (t('available') || 'Disponible')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default DaySchedule;

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDayScheduleHandlers } from '@/features/appointments/hooks/useDayScheduleHandlers';
import { useDayScheduleController } from '@/features/appointments/hooks/useDayScheduleController';

import DayScheduleHeader from './DayScheduleHeader.jsx';
import ScheduleTimeline from './ScheduleTimeline.jsx';
import { DayScheduleTable } from '../sections/DayScheduleTable.jsx';

import './DaySchedule.css';

const EMPTY_ARRAY = [];

/**
 * DaySchedule (Executor Component).
 * Orchestrates the display of daily appointments, time slots, and schedule navigation.
 * Now features a native toggle between timeline slots and interactive operative table.
 */
const DaySchedule = ({
    date, appointments, onSlotClick, doctor, schedule, onDateSelect,
    holidays = EMPTY_ARRAY, showOutOfHours, setShowOutOfHours, onNextFreeSlot,
    isLoading = false
}) => {
    const { t } = useLanguage();
    const [showCancelled, setShowCancelled] = React.useState(false);
    const [viewMode, setViewMode] = React.useState('timeline'); // 'timeline' | 'table'

    const { handlePrint, handlePrevDay, handleNextDay, handleToday, handleSlotAction } = useDayScheduleHandlers({
        date, appointments, doctor, onDateSelect, onSlotClick, showCancelled
    });

    const { timeSlots, loading } = useDayScheduleController(date, doctor, schedule, appointments, showOutOfHours);

    const isAppLoading = isLoading || loading;

    // Flatten appointments for the daily table view
    const dayAppointmentsFlat = React.useMemo(() => {
        return timeSlots.reduce((acc, slot) => {
            slot.slotApps.forEach(appt => {
                if (showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status)) {
                    acc.push({ ...appt, time: slot.time });
                }
            });
            return acc;
        }, []).sort((a, b) => a.time.getTime() - b.time.getTime());
    }, [timeSlots, showCancelled]);

    // Provide the pre-grouped appointments to ScheduleTimeline
    const getAppointmentsForSlot = (slotTime) => {
        const timeStr = slotTime.toTimeString().split(' ')[0]; // "08:00:00"
        const found = timeSlots.find(slot => slot.time.toTimeString().split(' ')[0] === timeStr);
        return found ? found.slotApps : [];
    };

    return (
        <div className="day-schedule">
            <DayScheduleHeader
                date={date} holiday={null} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                showCancelled={showCancelled} setShowCancelled={setShowCancelled}
                onPrevDay={handlePrevDay} onToday={handleToday} onNextDay={handleNextDay} onPrint={handlePrint}
                onNextFreeSlot={onNextFreeSlot}
                viewMode={viewMode} setViewMode={setViewMode}
                t={t}
            />

            {viewMode === 'table' ? (
                <DayScheduleTable dayAppointmentsFlat={dayAppointmentsFlat} t={t} onSlotClick={onSlotClick} />
            ) : (
                <ScheduleTimeline
                    timeSlots={timeSlots} showOutOfHours={showOutOfHours} showCancelled={showCancelled}
                    onSlotClick={onSlotClick} onSlotAction={handleSlotAction} getAppointmentsForSlot={getAppointmentsForSlot} t={t}
                    isLoading={isAppLoading}
                />
            )}
        </div>
    );
};

export default DaySchedule;

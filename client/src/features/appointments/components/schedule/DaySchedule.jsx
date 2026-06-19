import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDayScheduleHandlers } from '@/features/appointments/hooks/useDayScheduleHandlers';
import { useDayScheduleController } from '@/features/appointments/hooks/useDayScheduleController';

import DayScheduleHeader from './DayScheduleHeader.jsx';
import ScheduleTimeline from './ScheduleTimeline.jsx';

import styles from './DaySchedule.module.css';

const EMPTY_ARRAY = [];

/**
 * ECC-Pattern: Optimized DaySchedule (Executor).
 * Orchestrates the display of daily appointments using server-side fetching.
 */
const DaySchedule = ({
    date, onSlotClick, doctor, schedule, onDateSelect,
    holidays = EMPTY_ARRAY, showOutOfHours, setShowOutOfHours, onNextFreeSlot,
    isLoading = false
}) => {
    const { t } = useLanguage();
    const [showCancelled, setShowCancelled] = React.useState(false);

    // ECC: The controller now handles its own data fetching from the optimized endpoint
    const { timeSlots, loading } = useDayScheduleController(date, doctor, schedule, showOutOfHours);

    // Derived list of appointments just for the current view (from the daily fetch)
    const dailyAppointments = React.useMemo(() => 
        timeSlots.flatMap(slot => slot.slotApps), 
    [timeSlots]);

    const { handlePrint, handlePrevDay, handleNextDay, handleToday, handleSlotAction } = useDayScheduleHandlers({
        date, 
        appointments: dailyAppointments, 
        doctor, 
        onDateSelect, 
        onSlotClick, 
        showCancelled
    });

    const isAppLoading = isLoading || loading;

    const getAppointmentsForSlot = (slotTime) => {
        const timeStr = slotTime.toTimeString().split(' ')[0];
        const found = timeSlots.find(slot => slot.time.toTimeString().split(' ')[0] === timeStr);
        return found ? found.slotApps : [];
    };

    return (
        <div className={styles.root} data-scroll-container>
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
                isLoading={isAppLoading}
            />
        </div>
    );
};

export default DaySchedule;

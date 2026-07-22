import React, { useEffect, useRef } from 'react';
import AppointmentCard from '../cards/AppointmentCard';
import Icon from '@/components/atoms/Icon';
import { formatTime } from '@/utils/core/dateUtils';
import styles from './ScheduleTimeline.module.css';

/**
 * ScheduleTimeline (Executor Component).
 * Renders the list of time slots and their associated appointments.
 */
const ScheduleTimeline = ({
    timeSlots, showOutOfHours, showCancelled, onSlotClick, onSlotAction, getAppointmentsForSlot, t,
    isLoading = false
}) => {
    let timeMarkerRendered = false;
    const now = new Date();
    const markerRef = useRef(null);

    // Check if the current visible schedule is for today
    const isTodaySchedule = timeSlots.length > 0 &&
        timeSlots[0].time.getDate() === now.getDate() &&
        timeSlots[0].time.getMonth() === now.getMonth() &&
        timeSlots[0].time.getFullYear() === now.getFullYear();

    useEffect(() => {
        if (markerRef.current && isTodaySchedule) {
            const container = markerRef.current.closest('[data-scroll-container]');
            if (container) {
                const markerTop = markerRef.current.offsetTop;
                container.scrollTop = Math.max(0, markerTop - 80);
            } else {
                markerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [timeSlots, isTodaySchedule]);

    const filteredSlots = timeSlots.reduce((acc, slot) => {
                const slotApps = getAppointmentsForSlot(slot.time);
        if (showOutOfHours || slot.type !== 'closed' || slotApps.length > 0) {
            acc.push({ ...slot, slotApps });
        }
        return acc;
    }, []);



    return (
        <div className={`${styles.root}`}>
            {filteredSlots.map((slot, index) => {
                const { slotApps, type, isBlockedByGoogle, time } = slot;
                const isSlotClosed = type === 'closed';
                const isBlocked = isBlockedByGoogle || slotApps.some(a => !['cancelled', 'suspended', 'absent'].includes(a.status));
                const timeKey = time instanceof Date ? time.getTime() : time;

                const handleKeyDown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSlotAction(slot);
                    }
                };

                let isCurrentSlot = false;
                let progressPercent = 0;
                
                if (isTodaySchedule && !timeMarkerRendered) {
                    const nextTime = index < filteredSlots.length - 1 ? filteredSlots[index+1].time : new Date(time.getTime() + 60*60*1000);
                    if (now >= time && now < nextTime) {
                        isCurrentSlot = true;
                        timeMarkerRendered = true;
                        const totalDuration = nextTime.getTime() - time.getTime();
                        const elapsed = now.getTime() - time.getTime();
                        progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                    }
                }

                return (
                    <div key={timeKey} className={styles.slotContainer}>
                        {isCurrentSlot && (
                            <div ref={markerRef} className={styles.currentTimeLine} style={{ left: `${progressPercent}%` }}>
                                <div className={styles.currentTimeLineLabel}>AHORA</div>
                                <div className={styles.currentTimeLineBar}></div>
                            </div>
                        )}
                        {isBlockedByGoogle ? (
                            <div className={`${styles.googleBlocked}`}>
                                <Icon name="lock" size="1.2rem" />
                                <span>Bloqueado</span>
                            </div>
                        ) : slotApps.length > 0 ? (
                            slotApps.map(appt => {
                                if (showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status)) {
                                    return (
                                        <AppointmentCard
                                            key={appt.id} appt={appt}
                                            onClick={() => onSlotClick(time.getHours(), appt)}
                                            isLoading={isLoading}
                                        />
                                    );
                                }
                                return null;
                            })
                        ) : !isBlocked && (
                            <div
                                className={`${styles.availableCard} ${isSlotClosed ? styles.availableClosed : ''}`}
                                onClick={() => onSlotAction(slot)}
                                onKeyDown={handleKeyDown}
                                role="button"
                                tabIndex={0}
                                aria-label={`${t('available')} ${formatTime(time)}`}
                            >
                                <div className={styles.availableTimeTop}>
                                    {formatTime(time)}
                                </div>
                                <div className={styles.availableBody}>
                                    <span className={`${styles.availableIcon}`}>
                                        <Icon name={isSlotClosed ? 'lock' : 'add'} size="1.5rem" />
                                    </span>
                                    <span className={`${styles.availableLabel}`}>
                                        {isSlotClosed ? (t('closed_hours') || 'Fuera de Horario') : (t('available') || 'Disponible')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {/* If it's today and marker was never rendered, it means all slots are in the past. Render at the very end. */}
            {isTodaySchedule && !timeMarkerRendered && (
                <div ref={markerRef} className={styles.currentTimeLine}>
                    <div className={styles.currentTimeLineLabel}>AHORA</div>
                    <div className={styles.currentTimeLineBar}></div>
                </div>
            )}
        </div>
    );
};

export default ScheduleTimeline;

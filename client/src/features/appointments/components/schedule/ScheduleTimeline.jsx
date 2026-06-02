import React from 'react';
import AppointmentCard from '../cards/AppointmentCard';
import Icon from '@/components/atoms/Icon';
import { formatTime, isPast as checkIsPast } from '@/utils/core/dateUtils';
import './ScheduleTimeline.css';

/**
 * ScheduleTimeline (Executor Component).
 * Renders the list of time slots and their associated appointments.
 */
const ScheduleTimeline = ({
    timeSlots, showOutOfHours, showCancelled, onSlotClick, onSlotAction, getAppointmentsForSlot, t,
    isLoading = false
}) => {
    return (
        <div className="schedule-timeline">
            {timeSlots.reduce((acc, slot) => {
                const slotApps = getAppointmentsForSlot(slot.time);
                if (showOutOfHours || slot.type !== 'closed' || slotApps.length > 0) {
                    acc.push({ ...slot, slotApps });
                }
                return acc;
            }, []).map((slot) => {
                const { slotApps, type, isBlockedByGoogle, time } = slot;
                const isSlotClosed = type === 'closed';
                const isBlocked = isBlockedByGoogle || slotApps.some(a => !['cancelled', 'suspended', 'absent'].includes(a.status));
                const isPast = checkIsPast(time);
                const timeKey = time instanceof Date ? time.getTime() : time;

                const handleKeyDown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSlotAction(slot);
                    }
                };

                return (
                    <div key={timeKey} className={`schedule-timeline__slot ${isSlotClosed ? 'schedule-timeline__slot--closed' : ''} ${isPast ? 'schedule-timeline__slot--past' : ''}`}>
                        <div className="schedule-timeline__slot-content">
                            
                            {isBlockedByGoogle ? (
                                <div className="schedule-timeline__google-blocked">
                                    <Icon name="lock" size="1.2rem" />
                                    <span>Bloqueado (Google Calendar)</span>
                                </div>
                            ) : (
                                <div className={`schedule-timeline__apps-grid ${slotApps.length > 1 ? 'schedule-timeline__apps-grid--multiple' : ''}`}>
                                    {isLoading && slotApps.length === 0 ? (
                                        <AppointmentCard isLoading={true} />
                                    ) : (
                                        slotApps.reduce((acc, appt) => {
                                            if (showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status)) {
                                                acc.push(
                                                    <AppointmentCard
                                                        key={appt.id} appt={appt}
                                                        onClick={() => onSlotClick(time.getHours(), appt)}
                                                        isLoading={isLoading}
                                                    />
                                                );
                                            }
                                            return acc;
                                        }, [])
                                    )}
                                </div>
                            )}

                            {!isBlocked && (
                                <div
                                    className={`schedule-timeline__available ${isSlotClosed ? 'schedule-timeline__available--closed' : ''}`}
                                    onClick={() => onSlotAction(slot)}
                                    onKeyDown={handleKeyDown}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${t('available')} ${formatTime(time)}`}
                                >
                                    <span className="schedule-timeline__available-icon">
                                        <Icon name={isSlotClosed ? 'lock' : 'add'} size="1rem" />
                                    </span>
                                    <div className="schedule-timeline__available-info">
                                        <span className="schedule-timeline__available-time">{formatTime(time)}</span>
                                        <span className="schedule-timeline__available-label">
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
    );
};

export default ScheduleTimeline;

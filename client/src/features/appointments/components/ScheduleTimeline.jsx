import React from 'react';
import AppointmentCard from '@/features/appointments/components/AppointmentCard';
import Icon from '@/components/atoms/Icon';
import { formatTime, isPast as checkIsPast } from '@/utils/dateUtils';
import './ScheduleTimeline.css';

/**
 * ScheduleTimeline (Executor Component).
 * Renders the list of time slots and their associated appointments.
 */
const ScheduleTimeline = ({
    timeSlots, showOutOfHours, showCancelled, onSlotClick, onSlotAction, getAppointmentsForSlot, t
}) => {
    return (
        <div className="schedule-timeline">
            {timeSlots
                .map(slot => ({ ...slot, slotApps: getAppointmentsForSlot(slot.time, slot.duration) }))
                .filter(slot => showOutOfHours || slot.type !== 'closed' || slot.slotApps.length > 0)
                .map((slot, index) => {
                    const { slotApps, type } = slot;
                    const isSlotClosed = type === 'closed';
                    const isBlocked = slotApps.some(a => !['cancelled', 'suspended', 'absent'].includes(a.status));
                    const isPast = checkIsPast(slot.time);

                    return (
                        <div key={index} className={`schedule-timeline__slot ${isSlotClosed ? 'schedule-timeline__slot--closed' : ''} ${isPast ? 'schedule-timeline__slot--past' : ''}`}>
                            <div className="schedule-timeline__slot-content">
                                {slotApps
                                    .filter(appt => showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status))
                                    .map(appt => (
                                        <AppointmentCard
                                            key={appt.id} appt={appt}
                                            onClick={() => onSlotClick(slot.time.getHours(), appt)}
                                        />
                                    ))}

                                {!isBlocked && (
                                    <div
                                        className={`schedule-timeline__available ${isSlotClosed ? 'schedule-timeline__available--closed' : ''}`}
                                        onClick={() => onSlotAction(slot)}
                                    >
                                        <span className="schedule-timeline__available-icon">
                                            <Icon name={isSlotClosed ? 'lock' : 'add'} size="1rem" />
                                        </span>
                                        <div className="schedule-timeline__available-info">
                                            <span className="schedule-timeline__available-time">{formatTime(slot.time)}</span>
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

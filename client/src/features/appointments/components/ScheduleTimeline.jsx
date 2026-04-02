import React from 'react';
import AppointmentCard from './AppointmentCard';
import { formatTime, isPast as checkIsPast } from '../../../utils/dateUtils';

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
                        <div key={index} className={`time-slot ${isSlotClosed ? 'time-slot--closed' : ''} ${isPast ? 'time-slot--past' : ''}`}>
                            <div className="slot-content">
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
                                        className={`available-slot ${isSlotClosed ? 'available-slot--closed' : ''}`}
                                        onClick={() => onSlotAction(slot)}
                                    >
                                        <span className="available-slot__icon">{isSlotClosed ? '🚫' : '+'}</span>
                                        <div className="available-slot__info">
                                            <span className="available-slot__time">{formatTime(slot.time)}</span>
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
    );
};

export default ScheduleTimeline;

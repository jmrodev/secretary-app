import React from 'react';
import AppointmentCard from '../molecules/AppointmentCard';
import { formatTime } from '../../utils/dateUtils';

/**
 * ScheduleTimeline Molecule.
 * Renders the list of time slots and their associated appointments.
 */
const ScheduleTimeline = ({
    timeSlots,
    showOutOfHours,
    showCancelled,
    onSlotClick,
    onSlotAction,
    getAppointmentsForSlot,
    t
}) => {
    return (
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
                                        onClick={() => onSlotAction(slot)}
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
    );
};

export default ScheduleTimeline;

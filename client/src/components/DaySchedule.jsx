import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useConfig } from '../context/ConfigContext';
import AppointmentCard from './AppointmentCard';

const DaySchedule = ({ date, appointments, onSlotClick, doctor, schedule }) => {
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { settings } = useConfig();
    const [showOutOfHours, setShowOutOfHours] = React.useState(false);

    // Determine config based on schedule or defaults
    let daysConfig = [];
    if (schedule && schedule.length > 0) {
        daysConfig = schedule.filter(s => s.day_of_week === date.getDay() && s.is_break === 0);
    }

    const duration = (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60;

    const timeSlots = [];
    let currentTime = new Date(date);
    currentTime.setHours(0, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);

    while (currentTime < endTime) {
        const timeStr = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS
        let type = 'regular';

        if (daysConfig.length > 0) {
            const isOpen = daysConfig.some(block => {
                return timeStr >= block.start_time && timeStr < block.end_time;
            });
            if (!isOpen) type = 'closed';
        } else {
            // Default working hours if no schedule: 8-20
            const hour = currentTime.getHours();
            if (hour < 8 || hour >= 20) type = 'closed';
        }

        timeSlots.push({
            time: new Date(currentTime),
            type: type,
            duration: duration
        });

        currentTime = new Date(currentTime.getTime() + duration * 60000);
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
        <div className="day-schedule card">
            <div className="flex-between items-center mb-4 border-b pb-4 px-2">
                <h3 className="m-0">
                    {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <label className="switch-container">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">{t('show_out_of_hours') || 'Mostrar fuera de horario'}</span>
                    <div className="switch">
                        <input
                            type="checkbox"
                            checked={showOutOfHours}
                            onChange={(e) => setShowOutOfHours(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </div>
                </label>
            </div>

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
                        const { slotApps } = slot;
                        const isOccupied = slotApps.length > 0;
                        const isClosed = slot.type === 'closed';
                        const isBreak = slot.type === 'break'; // Legacy

                        const slotStyle = {};
                        if (isClosed) {
                            slotStyle.backgroundColor = '#f1f5f9'; // Slate-100
                            slotStyle.opacity = 0.6;
                            slotStyle.borderLeft = '4px solid #cbd5e1';
                        } else if (isBreak) {
                            slotStyle.backgroundColor = '#fffbeb'; // Amber-50
                        }

                        return (
                            <div key={index} className="time-slot" style={slotStyle}>
                                <div className="slot-content">
                                    {isOccupied ? (
                                        slotApps.map(appt => (
                                            <AppointmentCard
                                                key={appt.id}
                                                appt={appt}
                                                onClick={() => onSlotClick(slot.time.getHours(), appt)}
                                            />
                                        ))
                                    ) : (
                                        <div
                                            className={`available-slot ${isClosed ? 'cursor-warning' : ''}`}
                                            onClick={async () => {
                                                if (isClosed) {
                                                    if (await confirm("⚠️ Este horario está marcado como NO LABORABLE. ¿Desea asignar un turno de todas formas?")) {
                                                        onSlotClick(slot.time.getHours(), null, slot.time.getMinutes());
                                                    }
                                                } else {
                                                    onSlotClick(slot.time.getHours(), null, slot.time.getMinutes());
                                                }
                                            }}
                                        >
                                            <span className="plus-icon">{isClosed ? '🚫' : '+'}</span>
                                            <div className="flex-between w-full">
                                                <span className="text-sm font-bold opacity-80 font-mono">{slot.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="text-xs">{isClosed ? (t('closed_hours') || 'Fuera de Horario') : (t('available') || 'Disponible')}</span>
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


import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { useConfig } from '../../context/ConfigContext';
import AppointmentCard from '../molecules/AppointmentCard';

const DaySchedule = ({ date, appointments, onSlotClick, doctor, schedule }) => {
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { settings } = useConfig();
    const [showOutOfHours, setShowOutOfHours] = React.useState(false);
    const [showCancelled, setShowCancelled] = React.useState(false); // Show cancelled by default as hidden

    // 1. Determine Base Range (Schedule or Default 8-20)
    let startHour = 8;
    let endHour = 20;
    let daysConfig = [];

    if (schedule && schedule.length > 0) {
        const starts = schedule.map(s => parseInt(s.start_time.split(':')[0]));
        const ends = schedule.map(s => parseInt(s.end_time.split(':')[0]) + (parseInt(s.end_time.split(':')[1]) > 0 ? 1 : 0));
        startHour = Math.min(...starts, 8);
        endHour = Math.max(...ends, 20);
        daysConfig = schedule.filter(s => s.day_of_week === date.getDay() && s.is_break === 0);
    }

    // 2. Expand Range based on Existing Appointments (Always show what exists)
    const dayApps = appointments.filter(appt => {
        const d = new Date(appt.appointment_date);
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });

    if (dayApps.length > 0) {
        dayApps.forEach(a => {
            const h = new Date(a.appointment_date).getHours();
            if (h < startHour) startHour = h;
            if (h + 1 > endHour) endHour = h + 1;
        });
    }

    // 3. If Toggle is ON, show Full 24h. If OFF, use Logical Range.
    const finalStart = showOutOfHours ? 0 : startHour;
    const finalEnd = showOutOfHours ? 24 : endHour;

    const duration = (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60;

    const timeSlots = [];
    let currentTime = new Date(date);
    currentTime.setHours(finalStart, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(finalEnd, 0, 0, 0);

    while (currentTime < endTime) {
        const timeStr = currentTime.toTimeString().split(' ')[0];
        let type = 'regular';

        if (daysConfig.length > 0) {
            const isOpen = daysConfig.some(block => {
                return timeStr >= block.start_time && timeStr < block.end_time;
            });
            if (!isOpen) type = 'closed';
        } else {
            // Default logical working hours if no schedule
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
                <div className="flex gap-4">
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
                    <label className="switch-container">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Mostrar Cancelados</span>
                        <div className="switch">
                            <input
                                type="checkbox"
                                checked={showCancelled}
                                onChange={(e) => setShowCancelled(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </div>
                    </label>
                </div>
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
                        const { slotApps, type } = slot; // Destructure type here to be explicit

                        // Explicitly define variables in current scope to avoid reference errors
                        const isSlotClosed = type === 'closed';
                        const isSlotBreak = type === 'break';

                        // Logic: Blocked if there is a 'blocking' status appointment
                        const isBlocked = slotApps.some(a => !['cancelled', 'suspended', 'absent'].includes(a.status));

                        const slotStyle = {};
                        if (isSlotClosed) {
                            slotStyle.backgroundColor = '#f1f5f9'; // Slate-100
                            slotStyle.opacity = 0.6;
                            slotStyle.borderLeft = '4px solid #cbd5e1';
                        } else if (isSlotBreak) {
                            slotStyle.backgroundColor = '#fffbeb'; // Amber-50
                        }

                        return (
                            <div key={index} className="time-slot" style={slotStyle}>
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
                                            className={`available-slot ${isSlotClosed ? 'cursor-warning' : ''}`}
                                            onClick={async () => {
                                                if (isSlotClosed) {
                                                    const confirmed = await confirm("⚠️ Este horario está marcado como NO LABORABLE. ¿Desea asignar un turno de todas formas?");
                                                    if (confirmed) {
                                                        onSlotClick(slot.time.getHours(), null, slot.time.getMinutes());
                                                    }
                                                } else {
                                                    onSlotClick(slot.time.getHours(), null, slot.time.getMinutes());
                                                }
                                            }}
                                        >
                                            <span className="plus-icon">{isSlotClosed ? '🚫' : '+'}</span>
                                            <div className="flex-between w-full">
                                                <span className="text-sm font-bold opacity-80 font-mono">{slot.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="text-xs">{isSlotClosed ? (t('closed_hours') || 'Fuera de Horario') : (t('available') || 'Disponible')}</span>
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

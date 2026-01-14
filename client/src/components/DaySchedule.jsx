import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useConfig } from '../context/ConfigContext';
import { Users, AlertTriangle } from 'lucide-react';

const DaySchedule = ({ date, appointments, onSlotClick, onRatingChange, doctor, schedule }) => {
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { settings } = useConfig();

    const calculateFinancialRating = (debt) => {
        if (debt <= 0) return 5;
        if (debt < 1000) return 4;
        if (debt < 5000) return 3;
        if (debt < 10000) return 2;
        return 1;
    };

    const calculateAttendanceRating = (total, missed) => {
        if (!total || total === 0) return 5;
        const ratio = (total - missed) / total;
        if (ratio >= 0.95) return 5;
        if (ratio >= 0.85) return 4;
        if (ratio >= 0.70) return 3;
        if (ratio >= 0.50) return 2;
        return 1;
    };

    // Determine config based on schedule or defaults
    let startHour = 8;
    let endHour = 20;
    let daysConfig = [];

    if (schedule && schedule.length > 0) {
        const starts = schedule.map(s => parseInt(s.start_time.split(':')[0]));
        const ends = schedule.map(s => parseInt(s.end_time.split(':')[0]) + (parseInt(s.end_time.split(':')[1]) > 0 ? 1 : 0));

        if (starts.length) startHour = Math.min(8, ...starts);
        if (ends.length) endHour = Math.max(20, ...ends);

        daysConfig = schedule.filter(s => s.day_of_week === date.getDay() && s.is_break === 0);
    }

    const duration = (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60;

    const timeSlots = [];
    let currentTime = new Date(date);
    currentTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);

    while (currentTime < endTime) {
        const timeStr = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS
        let type = 'regular';

        if (daysConfig.length > 0) {
            const isOpen = daysConfig.some(block => {
                return timeStr >= block.start_time && timeStr < block.end_time;
            });
            if (!isOpen) type = 'closed';
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
            <h3 className="mb-4 text-center border-b pb-4">
                {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            <div className="schedule-timeline">
                {timeSlots.map((slot, index) => {
                    const slotApps = getAppointmentsForSlot(slot.time, slot.duration);
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
                            <div className="time-label">
                                {slot.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="slot-content">
                                {isOccupied ? (
                                    slotApps.map(appt => (
                                        <div
                                            key={appt.id}
                                            className={`appointment-card status-${appt.status}`}
                                            onClick={() => onSlotClick(slot.time.getHours(), appt)}
                                        >
                                            <div className="appt-time">
                                                {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="appt-details">
                                                <div className="flex items-center gap-2">
                                                    <strong>{appt.patient_name || appt.reason || 'Reserved'} ({t(appt.status)})</strong>
                                                    <span className="doctor-name hidden md:inline ml-2 text-xs text-slate-500">Dr. {appt.doctor_name}</span>
                                                </div>
                                                {appt.is_out_of_hours === 1 && <span className="text-xs text-amber-600 font-bold ml-2">⚠️ Fuera de Horario</span>}
                                            </div>
                                        </div>
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
                                        <span className="plus-icon">{isClosed ? '🚫' : '+'}</span> {isClosed ? (t('closed_hours') || 'Fuera de Horario') : (t('available') || 'Disponible')}
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


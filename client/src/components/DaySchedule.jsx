import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useConfig } from '../context/ConfigContext';

const DaySchedule = ({ date, appointments, onSlotClick, onRatingChange, doctor, schedule, onWhatsAppConfirm }) => {
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

        // [EXPANSION] Only expand if there are appointments ON THIS DAY outside the range
        if (appointments && appointments.length > 0) {
            appointments.forEach(appt => {
                const apptDate = new Date(appt.appointment_date);
                // Only consider if it's the same day we are viewing
                if (apptDate.getFullYear() === date.getFullYear() &&
                    apptDate.getMonth() === date.getMonth() &&
                    apptDate.getDate() === date.getDate()) {

                    const apptHour = apptDate.getHours();
                    if (apptHour < startHour) startHour = apptHour;
                    if (apptHour + 1 > endHour) endHour = apptHour + 1;
                }
            });
        }

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
                                            className={`appointment-card group status-${appt.status} ${appt.source === 'google' || appt.source === 'google-incomplete' ? 'status-external' : ''}`}
                                            onClick={() => onSlotClick(slot.time.getHours(), appt)}
                                            style={appt.source === 'google' || appt.source === 'google-incomplete' || appt.status === 'external' ? { borderLeft: '4px solid var(--amber-500)' } : {}}
                                        >
                                            {/* Col 1: Time */}
                                            <div className="appt-time-box">
                                                <span className="text-sm font-bold text-main-900">
                                                    {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </span>
                                            </div>

                                            {/* Col 2: Info */}
                                            <div className="appt-info">
                                                <div className="font-bold text-main-800 truncate">
                                                    {appt.type === 'virtual' && '📹 '}
                                                    {appt.patient_name || 'S/N'}
                                                </div>
                                                {appt.patient_phone && (
                                                    <div className="text-[10px] text-indigo-600 font-medium">
                                                        📱 {appt.patient_phone}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-[11px] text-muted truncate">
                                                    <span className="flex items-center gap-1">👨‍⚕️ {appt.doctor_name}</span>
                                                    {appt.reason && <span className="italic opacity-75 truncate">• {appt.reason}</span>}
                                                </div>
                                            </div>

                                            {/* Col 3: Status */}
                                            <div className="appt-status">
                                                {appt.payment_status === 'paid' && <span title="Paid" className="text-emerald-500 font-bold text-xs">$✓</span>}
                                                {appt.payment_status === 'debt' && <span title="Debt" className="text-rose-500 font-bold text-xs">$!</span>}

                                                <span className={`status-chip-mini status-${appt.status} inline-block`}>
                                                    {t(appt.status) || appt.status}
                                                </span>
                                            </div>

                                            {/* Col 4: Action */}
                                            <div className="appt-actions">
                                                {onWhatsAppConfirm && (
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        onWhatsAppConfirm(appt);
                                                    }}
                                                        className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100"
                                                        title="WhatsApp"
                                                    >
                                                        📲
                                                    </button>
                                                )}
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


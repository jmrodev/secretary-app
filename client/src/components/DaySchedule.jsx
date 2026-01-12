import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const DaySchedule = ({ date, appointments, onSlotClick, onRatingChange }) => {
    const { t } = useLanguage();

    const calculateFinancialRating = (debt) => {
        if (debt <= 0) return 5;
        if (debt < 1000) return 4;
        if (debt < 5000) return 3;
        if (debt < 10000) return 2;
        return 1;
    };

    const calculateAttendanceRating = (total, missed) => {
        if (!total || total === 0) return 5; // New patient
        const ratio = (total - missed) / total;
        if (ratio >= 0.95) return 5;
        if (ratio >= 0.85) return 4;
        if (ratio >= 0.70) return 3;
        if (ratio >= 0.50) return 2;
        return 1;
    };

    // Generate hourly slots from 8 AM to 8 PM
    const startHour = 8;
    const endHour = 20; // Last slot starts at 20:00 (8 PM)
    const timeSlots = [];

    for (let i = startHour; i <= endHour; i++) {
        timeSlots.push(i);
    }

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getAppointmentsForHour = (hour) => {
        return appointments.filter(appt => {
            const apptDate = new Date(appt.appointment_date);
            return isSameDay(apptDate, date) && apptDate.getHours() === hour;
        });
    };

    return (
        <div className="day-schedule card">
            <h3 className="mb-4 text-center border-b pb-4">
                {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            <div className="schedule-timeline">
                {timeSlots.map(hour => {
                    const hourApps = getAppointmentsForHour(hour);
                    const isOccupied = hourApps.length > 0;

                    return (
                        <div key={hour} className="time-slot">
                            <div className="time-label">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            <div className="slot-content">
                                {isOccupied ? (
                                    hourApps.map(appt => (
                                        <div
                                            key={appt.id}
                                            className={`appointment-card status-${appt.status}`}
                                            onClick={() => onSlotClick(hour, appt)}
                                        >
                                            <div className="appt-time">
                                                {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="appt-details">
                                                <div className="flex items-center gap-2">
                                                    <strong>{appt.patient_name || 'Reserved'} ({t(appt.status)})</strong>
                                                    {/* Compliance Ratings */}
                                                    <div className="flex gap-2 mt-1">
                                                        {appt.total_debt !== undefined && (
                                                            <div className="rating-mini-stars text-gold" title={`Financiero: $${appt.total_debt}`}>
                                                                {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= calculateFinancialRating(Number(appt.total_debt)) ? '★' : '☆'}</span>)}
                                                            </div>
                                                        )}
                                                        {appt.total_appointments !== undefined && (
                                                            <div className="rating-mini-stars text-blue" title={`Asistencia: ${appt.total_appointments - appt.missed_appointments}/${appt.total_appointments}`}>
                                                                {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= calculateAttendanceRating(appt.total_appointments, appt.missed_appointments) ? '★' : '☆'}</span>)}
                                                            </div>
                                                        )}
                                                        {appt.behavior_rating !== undefined && (
                                                            <div className="rating-mini-stars text-pink" title="Comportamiento">
                                                                {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= (appt.behavior_rating || 5) ? '★' : '☆'}</span>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="doctor-name">Dr. {appt.doctor_name}</span>
                                                {appt.reason && (
                                                    <div className="appt-reason-label">
                                                        💬 {appt.reason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        className="available-slot"
                                        onClick={() => onSlotClick(hour, null)}
                                    >
                                        <span className="plus-icon">+</span> {t('available') || 'Available'}
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

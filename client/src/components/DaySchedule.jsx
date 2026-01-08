import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const DaySchedule = ({ date, appointments, onSlotClick, onRatingChange }) => {
    const { t } = useLanguage();

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
                                                    {/* Financial Rating */}
                                                    {appt.financial_rating !== undefined && appt.financial_rating !== null && (
                                                        <div
                                                            title="Cumplimiento Financiero"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newRating = (appt.financial_rating % 5) + 1; // Cycle 1-5
                                                                if (onRatingChange) onRatingChange(appt.patient_id, newRating);
                                                            }}
                                                            style={{ display: 'flex', color: '#f59e0b', fontSize: '1rem', cursor: 'pointer', userSelect: 'none' }}
                                                        >
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <span key={star}>
                                                                    {star <= (appt.financial_rating) ? '★' : '☆'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="doctor-name">Dr. {appt.doctor_name}</span>
                                                {appt.reason && (
                                                    <div style={{ fontSize: '0.75rem', color: '#6366f1', fontStyle: 'italic', marginTop: '0.2rem' }}>
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

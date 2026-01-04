import React from 'react';

const DaySchedule = ({ date, appointments, onSlotClick, onRatingChange }) => {
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
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <strong>{appt.patient_name || 'Reserved'}</strong>
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
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        className="available-slot"
                                        onClick={() => onSlotClick(hour, null)}
                                    >
                                        <span className="plus-icon">+</span> Available
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .day-schedule {
                    padding: 1.5rem;
                    height: 100%;
                }
                .schedule-timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .time-slot {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    min-height: 60px;
                }
                .time-label {
                    width: 50px;
                    text-align: right;
                    font-weight: 500;
                    color: #64748b;
                    font-size: 0.9rem;
                    padding-top: 0.5rem;
                }
                .slot-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .available-slot {
                    background-color: #f8fafc;
                    border: 1px dashed #cbd5e1;
                    border-radius: 6px;
                    padding: 0.5rem 1rem;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .available-slot:hover {
                    background-color: #eff6ff;
                    border-color: #60a5fa;
                    color: #3b82f6;
                }
                .appointment-card {
                    padding: 0.75rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: transform 0.1s;
                }
                .appointment-card:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .appt-time {
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .appt-details {
                    display: flex;
                    flex-direction: column;
                }
                .doctor-name {
                    font-size: 0.8rem;
                    opacity: 0.8;
                }
                
                /* Status Colors */
                .status-confirmed, .status-completed {
                    background-color: #dcfce7;
                    border: 1px solid #bbf7d0;
                    color: #166534;
                }
                .status-cancelled {
                    background-color: #fee2e2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                    opacity: 0.7;
                }
                .status-pending {
                    background-color: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                }

                @media (max-width: 768px) {
                    .calendar-container, .day-schedule {
                        margin-bottom: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default DaySchedule;

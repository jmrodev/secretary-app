import React, { useState, useEffect } from 'react';

import { useLanguage } from '../context/LanguageContext';

const Calendar = ({ selectedDate, onDateSelect, appointments = [], holidays = [] }) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate || new Date()));
    const { t } = useLanguage();

    // Sync viewDate when selectedDate changes (e.g. from parent or next/prev navigation)
    useEffect(() => {
        if (selectedDate) {
            setViewDate(new Date(selectedDate));
        }
    }, [selectedDate]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const { days, firstDay } = getDaysInMonth(viewDate);

    // Get translated arrays; default to English if missing (safety check)
    const months = t('months_array') || [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const daysOfWeek = t('days_short_array') || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePrevMonth = () => {
        setViewDate(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            onDateSelect(newDate);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setViewDate(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
            onDateSelect(newDate);
            return newDate;
        });
    };

    const renderDays = () => {
        const dayElements = [];

        // Empty slots for days before start of month
        for (let i = 0; i < firstDay; i++) {
            dayElements.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let i = 1; i <= days; i++) {
            const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
            const isSelected = selectedDate && isSameDay(new Date(selectedDate), currentDay);
            const isToday = isSameDay(new Date(), currentDay);

            // Check if this day has appointments
            const hasAppointments = appointments.some(appt =>
                isSameDay(new Date(appt.appointment_date), currentDay)
            );

            // Check if holiday
            const dateStr = currentDay.toISOString().split('T')[0];
            const isHoliday = holidays && holidays.find(h => h.date.startsWith(dateStr));

            dayElements.push(
                <div
                    key={i}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isHoliday ? 'holiday' : ''}`}
                    onClick={() => onDateSelect(currentDay)}
                    title={isHoliday ? isHoliday.description : ''}
                >
                    <span className="day-number">{i}</span>
                    {hasAppointments && <div className="appointment-dot"></div>}
                </div>
            );
        }
        return dayElements;
    };

    return (
        <div className="calendar-container card">
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrevMonth}>⬅️</button>
                <h3>{months[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                <button className="calendar-nav-btn" onClick={handleNextMonth}>➡️</button>
            </div>
            <div className="calendar-grid">
                {daysOfWeek.map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}
                {renderDays()}
            </div>
            <style>{`
                .calendar-container {
                    padding: 1.5rem;
                }
                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .calendar-nav-btn {
                    background: var(--gray-100);
                    border: 1px solid var(--gray-200);
                    cursor: pointer;
                    font-size: 1rem;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .calendar-nav-btn:hover {
                    background: var(--blue-100);
                    border-color: var(--blue-300);
                    transform: scale(1.1);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .calendar-nav-btn:active {
                    transform: scale(0.95);
                }
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0.25rem;
                }
                .calendar-day-header {
                    text-align: center;
                    font-weight: 600;
                    color: #64748b;
                    font-size: 0.875rem;
                    padding-bottom: 0.5rem;
                }
                .calendar-day {
                    aspect-ratio: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    border-radius: 50%;
                    font-size: 0.9rem;
                    position: relative;
                    transition: all 0.2s;
                }
                .calendar-day:hover:not(.empty) {
                    background-color: #f1f5f9;
                }
                .calendar-day.selected {
                    background-color: #3b82f6;
                    color: white;
                }
                .calendar-day.today {
                    border: 1px solid #3b82f6;
                }
                .appointment-dot {
                    width: 4px;
                    height: 4px;
                    background-color: #ef4444;
                    border-radius: 50%;
                    position: absolute;
                    bottom: 6px;
                }
                .calendar-day.selected .appointment-dot {
                    background-color: white;
                }
                .calendar-day.holiday {
                    background-color: #fee2e2;
                    color: #991b1b;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default Calendar;

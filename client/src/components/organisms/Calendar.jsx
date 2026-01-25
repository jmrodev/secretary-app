import React, { useState, useEffect } from 'react';

import { useLanguage } from '../../context/LanguageContext';

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
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        setViewDate(newDate);
        onDateSelect(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        setViewDate(newDate);
        onDateSelect(newDate);
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
        </div>
    );
};

export default Calendar;

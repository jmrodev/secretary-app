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
            dayElements.push(<div key={`empty-${i}`} className="calendar-grid__cell calendar-grid__cell--empty"></div>);
        }

        for (let i = 1; i <= days; i++) {
            const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
            const isSelected = selectedDate && isSameDay(new Date(selectedDate), currentDay);
            const isToday = isSameDay(new Date(), currentDay);

            // Count appointments for this day
            const dayAppts = appointments.filter(appt =>
                isSameDay(new Date(appt.appointment_date), currentDay)
            );
            const count = dayAppts.length;

            // Check if holiday
            const dateStr = currentDay.toISOString().split('T')[0];
            const isHolidayObj = holidays && holidays.find(h => h.date.startsWith(dateStr));

            let cellClasses = 'calendar-grid__cell calendar-grid__cell--interactive';
            if (isSelected) cellClasses += ' calendar-grid__cell--selected';
            if (isToday) cellClasses += ' calendar-grid__cell--today';
            if (isHolidayObj) cellClasses += ' calendar-grid__cell--holiday';

            // Inline style for selected state fallback if class missing in new CSS
            const selectedStyle = isSelected ? { ring: '2px solid var(--blue-600)', backgroundColor: 'var(--blue-50)' } : {};
            const holidayStyle = isHolidayObj ? { backgroundColor: 'var(--red-50)' } : {};

            dayElements.push(
                <div
                    key={i}
                    className={cellClasses}
                    onClick={() => onDateSelect(currentDay)}
                    title={isHolidayObj ? isHolidayObj.description : ''}
                    style={{ ...selectedStyle, ...holidayStyle }}
                >
                    <div className="flex flex-col items-center">
                        <span className={`calendar-grid__date-number ${isSelected ? 'text-blue-700' : ''}`}>{i}</span>
                        {isToday && <span className="calendar-grid__today-badge">HOY</span>}
                    </div>

                    {count > 0 && (
                        <div className="calendar-grid__indicators">
                            <div className="calendar-grid__badge calendar-grid__badge--normal">
                                <span>📅</span><span>{count}</span>
                            </div>
                        </div>
                    )}
                    {isHolidayObj && (
                        <div className="calendar-grid__indicators">
                            <span style={{ fontSize: '0.6rem', color: 'var(--red-500)' }}>🏖️</span>
                        </div>
                    )}
                </div>
            );
        }
        return dayElements;
    };

    return (
        <div className="calendar-grid">
            <div className="calendar-grid__header">
                <button className="calendar-grid__nav-btn" onClick={handlePrevMonth}>⬅️</button>
                <h3 className="calendar-grid__title">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                <button className="calendar-grid__nav-btn" onClick={handleNextMonth}>➡️</button>
            </div>

            <div className="calendar-grid__days-row">
                {daysOfWeek.map(day => (
                    <div key={day} className="calendar-grid__day-name">{day}</div>
                ))}
            </div>

            <div className="calendar-grid__body">
                {renderDays().map((dayElement, index) => {
                    // Need to adapt the rendered day elements to new classes if possible, 
                    // or wrap them. renderDays returns elements with 'calendar-day' class.
                    // It's cleaner to rewrite renderDays logic here or modify renderDays function.
                    // But for now, let's map properties if possible or just use the existing renderDays result 
                    // and hope the .calendar-grid__body > * styles apply correctly.
                    // Wait, my CSS targets .calendar-grid__cell specifically.
                    // The old code returns <div className="calendar-day ...">
                    // I should Update renderDays too.
                    return dayElement;
                })}
            </div>
        </div>
    );
};

export default Calendar;

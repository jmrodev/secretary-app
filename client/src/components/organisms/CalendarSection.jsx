
import React from 'react';
import Calendar from './Calendar';
import HolidayForm from '../molecules/HolidayForm';
import './CalendarSection.css';

const CalendarSection = ({
    activeTab,
    selectedDate,
    onDateSelect,
    appointments = [],
    calendarStats = {},
    holidays = [],
    onAddHoliday
}) => {
    return (
        <div className="calendar-section">
            {(activeTab === 'calendar' || activeTab === 'monthly') ? (
                <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={onDateSelect}
                    appointments={appointments}
                    calendarStats={calendarStats}
                    holidays={holidays}
                />
            ) : (
                <div className="card holiday-card">
                    <h3 className="config-group__title holiday-card__title">🏖️ Agregar Feriado</h3>
                    <p className="config-field__hint holiday-card__hint">
                        Bloquea días específicos en la agenda.
                    </p>
                    <HolidayForm onAdd={onAddHoliday} />
                </div>
            )}
        </div>
    );
};

export default CalendarSection;

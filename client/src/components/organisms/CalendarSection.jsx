
import React from 'react';
import Calendar from './Calendar';
import HolidayForm from '../molecules/HolidayForm';

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
                <div className="calendar-section__card card h-full animate-in">
                    <h3 className="config-section-title">🏖️ Agregar Feriado</h3>
                    <p className="text-sm text-muted mb-6">
                        Bloquea días específicos en la agenda.
                    </p>
                    <HolidayForm onAdd={onAddHoliday} />
                </div>
            )}
        </div>
    );
};

export default CalendarSection;

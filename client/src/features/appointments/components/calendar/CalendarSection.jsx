import React from 'react';
import Calendar from '@/features/appointments/components/calendar/Calendar.jsx';
import HolidayForm from '@/features/appointments/components/forms/HolidayForm.jsx';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import './CalendarSection.css';

/**
 * CalendarSection (Executor Component).
 * Side panel (or main depending on view) for monthly calendar navigation and tools.
 */
const CalendarSection = ({
    activeTab, selectedDate, onDateSelect, appointments = [], calendarStats = {}, holidays = [],
    onAddHoliday, showOutOfHours, viewDoctorId, onSearchPatientId, searchPatientId,
    onCreatePatient, onNextFreeSlot, onSyncDayToGoogle, className = ""
}) => {
    const { t } = useLanguage();

    return (
        <div className={`calendar-section ${className}`}>
            {(activeTab === 'calendar' || activeTab === 'monthly') ? (
                <>
                    <Calendar
                        selectedDate={selectedDate} onDateSelect={onDateSelect}
                        appointments={appointments} calendarStats={calendarStats}
                        holidays={holidays} showOutOfHours={showOutOfHours}
                        compact={true}
                    />

                    {/* Tools section removed per user request */}
                </>
            ) : (
                <div className="dashboard-card holiday-card">
                    <h3 className="dashboard-card__title">
                        <Icon name="event_busy" size="1rem" />
                        {t('block_agenda')}
                    </h3>
                    <p className="calendar-section__info-text">
                        {t('holiday_license_info')}
                    </p>
                    <HolidayForm onAdd={onAddHoliday} />
                </div>
            )}
        </div>
    );
};

export default CalendarSection;

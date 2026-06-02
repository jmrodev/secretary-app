import React from 'react';
import Calendar from './Calendar.jsx';
import HolidayForm from '../forms/HolidayForm.jsx';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import './CalendarSection.css';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/**
 * CalendarSection (Executor Component).
 * Side panel (or main depending on view) for monthly calendar navigation and tools.
 */
const CalendarSection = ({
    activeTab, selectedDate, onDateSelect, appointments = EMPTY_ARRAY, calendarStats = EMPTY_OBJECT, holidays = EMPTY_ARRAY,
    onAddHoliday, showOutOfHours, viewDoctorId, onSearchPatientId, searchPatientId,
    onCreatePatient, onNextFreeSlot, onSyncDayToGoogle, className = ""
}) => {
    const { t } = useLanguage();

    return (
        <div className={`calendar-section ${className}`}>
            {activeTab === 'calendar' ? (
                <Calendar
                    selectedDate={selectedDate} onDateSelect={onDateSelect}
                    appointments={appointments} calendarStats={calendarStats}
                    holidays={holidays} showOutOfHours={showOutOfHours}
                    compact={true}
                />
            ) : activeTab === 'monthly' ? (
                <div className="calendar-section__monthly-layout animate-fade-in">
                    <div className="calendar-section__monthly-calendar">
                        <Calendar
                            selectedDate={selectedDate} onDateSelect={onDateSelect}
                            appointments={appointments} calendarStats={calendarStats}
                            holidays={holidays} showOutOfHours={showOutOfHours}
                            compact={false}
                        />
                    </div>
                    <div className="calendar-section__monthly-sidebar">
                        <div className="calendar-section__holiday-card dashboard-card">
                            <h3 className="dashboard-card__title">
                                <Icon name="event_busy" size="1rem" />
                                {t('block_agenda')}
                            </h3>
                            <p className="calendar-section__info-text">
                                {t('holiday_license_info')}
                            </p>
                            <HolidayForm onAdd={onAddHoliday} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="calendar-section__holiday-card dashboard-card">
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

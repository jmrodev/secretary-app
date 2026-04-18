import React from 'react';
import Calendar from '@/features/appointments/components/Calendar.jsx';
import HolidayForm from '@/features/appointments/components/HolidayForm.jsx';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { PatientSearchSelect } from '@/features/patients';
import { useLanguage } from '@/context/LanguageContext';
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
                    />

                    {activeTab === 'calendar' && (
                        <div className="calendar-section__tools-container">
                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="history" size="1rem" />
                                    {t('search_history')}
                                </h3>
                                <div className="calendar-section__filter-group">
                                    <PatientSearchSelect
                                        value={searchPatientId} placeholder={t('search_placeholder')}
                                        onChange={onSearchPatientId} onCreatePatient={onCreatePatient}
                                    />
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="build" size="1rem" />
                                    {t('tools')}
                                </h3>
                                <div className="calendar-section__tools-group">
                                    <Button
                                        variant="outline" className="calendar-section__tool-btn-main"
                                        onClick={onNextFreeSlot} icon={<Icon name="search" size="1.1rem" />}
                                    >
                                        {t('next_free_slot')}
                                    </Button>
                                    <Button
                                        variant="outline" onClick={() => onSyncDayToGoogle && onSyncDayToGoogle()}
                                        title={t('sync_google_calendar')}
                                        icon={<Icon name="sync" size="1.1rem" />}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
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

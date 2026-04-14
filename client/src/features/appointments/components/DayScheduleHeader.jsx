import React from 'react';
import Button from '@/components/atoms/Button';
import Switch from '@/components/atoms/Switch';
import Icon from '@/components/atoms/Icon';
import { formatDate } from '@/utils/dateUtils';

/**
 * DayScheduleHeader (Internal to feature).
 * Manages daily navigation and view controls.
 */
const DayScheduleHeader = ({
    date, holiday, showOutOfHours, setShowOutOfHours, showCancelled, setShowCancelled,
    onPrevDay, onToday, onNextDay, onPrint, t
}) => {
    return (
        <header className="day-schedule__header">
            <div className="day-schedule__title-group">
                <h3 className="day-schedule__title">
                    {formatDate(date, { weekday: true, monthName: true, hideYear: true })}
                </h3>
                {holiday && (
                    <span className="day-schedule__holiday-badge">
                        <Icon name="beach_access" size="1rem" /> {holiday.description}
                    </span>
                )}
            </div>

            <div className="day-schedule__nav">
                <Button 
                    variant="ghost" 
                    size="sm-compact" 
                    onClick={onPrevDay} 
                    icon={<Icon name="chevron_left" />} 
                />
                <Button variant="ghost" size="sm-compact" onClick={onToday}>
                    {t('today')}
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm-compact" 
                    onClick={onNextDay} 
                    icon={<Icon name="chevron_right" />} 
                />
            </div>

            <div className="day-schedule__toolbar">
                <div className="day-schedule__controls">
                    <Switch label={t('show_out_of_hours')} checked={showOutOfHours} onChange={setShowOutOfHours} />
                    <Switch label={t('show_cancelled')} checked={showCancelled} onChange={setShowCancelled} />
                </div>
                <Button 
                    variant="ghost" 
                    size="sm-compact" 
                    onClick={onPrint} 
                    icon={<Icon name="print" />}
                >
                    {t('print')}
                </Button>
            </div>
        </header>
    );
};

export default DayScheduleHeader;

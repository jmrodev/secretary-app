import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Switch from '@/components/atoms/Switch';
import { formatDate } from '@/utils/core/dateUtils';
import './DayScheduleHeader.css';

/**
 * DayScheduleHeader (Internal to feature).
 * Manages daily navigation and view controls.
 */
const DayScheduleHeader = ({
    date, holiday, showOutOfHours, setShowOutOfHours, showCancelled, setShowCancelled,
    onPrevDay, onToday, onNextDay, onPrint, onNextFreeSlot, t,
    viewMode, setViewMode
}) => {
    return (
        <header className="day-schedule-header">
            <div className="day-schedule-header__title-group">
                <h3 className="day-schedule-header__title">
                    {formatDate(date, { weekday: true, monthName: true, hideYear: true })}
                </h3>
                {holiday && (
                    <span className="day-schedule-header__holiday-badge">
                        <Icon name="beach_access" />
                        <span>{holiday.description}</span>
                    </span>
                )}
            </div>

            <div className="day-schedule-header__nav">
                <Button variant="ghost" size="sm-compact" onClick={onPrevDay} icon={<Icon name="chevron_left" />} />
                <Button variant="ghost" size="sm-compact" onClick={onToday}>{t('today')}</Button>
                <Button variant="ghost" size="sm-compact" onClick={onNextDay} icon={<Icon name="chevron_right" />} />
            </div>

            <div className="day-schedule-header__toolbar">
                <div className="day-schedule-header__view-toggle">
                    <Button 
                        variant={viewMode === 'timeline' ? 'primary' : 'ghost'} 
                        size="sm-compact" 
                        onClick={() => setViewMode('timeline')}
                        icon={<Icon name="view_day" size="0.95rem" />}
                        title={t('timeline_view')}
                    />
                    <Button 
                        variant={viewMode === 'table' ? 'primary' : 'ghost'} 
                        size="sm-compact" 
                        onClick={() => setViewMode('table')}
                        icon={<Icon name="table_rows" size="0.95rem" />}
                        title={t('table_view')}
                    />
                </div>
                <div className="day-schedule-header__controls">
                    <Switch label={t('show_out_of_hours')} checked={showOutOfHours} onChange={setShowOutOfHours} />
                    <Switch label={t('show_cancelled')} checked={showCancelled} onChange={setShowCancelled} />
                </div>
                <Button variant="ghost" size="sm-compact" onClick={onPrint} icon={<Icon name="print" />}>{t('print')}</Button>
            </div>
        </header>
    );
};

export default DayScheduleHeader;

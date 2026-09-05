import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Switch } from '@/components/atoms/Switch';
import { formatDate } from '@/utils/core/dateUtils';
import styles from './DayScheduleHeader.module.css';

/**
 * DayScheduleHeader (Internal to feature).
 * Manages daily navigation and view controls.
 */
export const DayScheduleHeader = ({
    date, holiday, showOutOfHours, setShowOutOfHours, showCancelled, setShowCancelled,
    onPrevDay, onToday, onNextDay, onPrint, onNextFreeSlot: _onNextFreeSlot, t
}) => {
    return (
        <header className={styles.DayScheduleHeader__root}>
            {/* LEFT: Date Navigator */}
            <div className={styles.DayScheduleHeader__left}>
                <Button 
                    variant="ghost" 
                    size="sm-compact" 
                    onClick={onPrevDay} 
                    icon={<Icon name="chevron_left" size="1.1rem" />} 
                    title={t('previous_day')}
                />
                <h3 className={styles.DayScheduleHeader__title}>
                    {formatDate(date, { weekday: true, monthName: true, hideYear: true })}
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm-compact" 
                    onClick={onNextDay} 
                    icon={<Icon name="chevron_right" size="1.1rem" />} 
                    title={t('next_day')}
                />
                <Button 
                    variant="ghost" 
                    size="sm-compact" 
                    onClick={onToday}
                >
                    {t('today')}
                </Button>
                {holiday && (
                    <span className={styles.DayScheduleHeader__holidayBadge}>
                        <Icon name="beach_access" size="0.9rem" />
                        <span>{holiday.description}</span>
                    </span>
                )}
            </div>

            {/* RIGHT: View Switches & Print */}
            <div className={styles.DayScheduleHeader__right}>
                <div className={styles.DayScheduleHeader__controls}>
                    <Switch label={t('show_out_of_hours')} checked={showOutOfHours} onChange={setShowOutOfHours} />
                    <Switch label={t('show_cancelled')} checked={showCancelled} onChange={setShowCancelled} />
                </div>
                <Button variant="ghost" size="sm-compact" onClick={onPrint} icon={<Icon name="print" size="1rem" />}>
                    {t('print')}
                </Button>
            </div>
        </header>
    );
};


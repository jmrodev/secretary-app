import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Switch } from '@/components/atoms/Switch';
import { formatDate } from '@/utils/core/dateUtils';
import { LiveClock } from '@/components/atoms/LiveClock';
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
        <header className={`${styles.DayScheduleHeader__root}`}>
            <div className={`${styles.DayScheduleHeader__titleGroup}`}>
                <h3 className={`${styles.DayScheduleHeader__title}`}>
                    {formatDate(date, { weekday: true, monthName: true, hideYear: true })}
                </h3>
                <LiveClock hideDate={true} className={`${styles.DayScheduleHeader__clock}`} />
                {holiday && (
                    <span className={`${styles.DayScheduleHeader__holidayBadge}`}>
                        <Icon name="beach_access" />
                        <span>{holiday.description}</span>
                    </span>
                )}
            </div>

            <div className={`${styles.DayScheduleHeader__nav}`}>
                <Button variant="ghost" size="sm-compact" onClick={onPrevDay} icon={<Icon name="chevron_left" />} />
                <Button variant="ghost" size="sm-compact" onClick={onToday}>{t('today')}</Button>
                <Button variant="ghost" size="sm-compact" onClick={onNextDay} icon={<Icon name="chevron_right" />} />
            </div>

            <div className={`${styles.DayScheduleHeader__toolbar}`}>

                <div className={`${styles.DayScheduleHeader__controls}`}>
                    <Switch label={t('show_out_of_hours')} checked={showOutOfHours} onChange={setShowOutOfHours} />
                    <Switch label={t('show_cancelled')} checked={showCancelled} onChange={setShowCancelled} />
                </div>
                <Button variant="ghost" size="sm-compact" onClick={onPrint} icon={<Icon name="print" />}>{t('print')}</Button>
            </div>
        </header>
    );
};


import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Switch from '@/components/atoms/Switch';
import { formatDate } from '@/utils/core/dateUtils';
import LiveClock from '@/components/atoms/LiveClock';
import styles from './DayScheduleHeader.module.css';

/**
 * DayScheduleHeader (Internal to feature).
 * Manages daily navigation and view controls.
 */
const DayScheduleHeader = ({
    date, holiday, showOutOfHours, setShowOutOfHours, showCancelled, setShowCancelled,
    onPrevDay, onToday, onNextDay, onPrint, onNextFreeSlot, t
}) => {
    return (
        <header className={`${styles.root}`}>
            <div className={`${styles.titleGroup}`}>
                <h3 className={`${styles.title}`}>
                    {formatDate(date, { weekday: true, monthName: true, hideYear: true })}
                </h3>
                <LiveClock hideDate={true} className={`${styles.clock}`} />
                {holiday && (
                    <span className={`${styles.holidayBadge}`}>
                        <Icon name="beach_access" />
                        <span>{holiday.description}</span>
                    </span>
                )}
            </div>

            <div className={`${styles.nav}`}>
                <Button variant="ghost" size="sm-compact" onClick={onPrevDay} icon={<Icon name="chevron_left" />} />
                <Button variant="ghost" size="sm-compact" onClick={onToday}>{t('today')}</Button>
                <Button variant="ghost" size="sm-compact" onClick={onNextDay} icon={<Icon name="chevron_right" />} />
            </div>

            <div className={`${styles.toolbar}`}>

                <div className={`${styles.controls}`}>
                    <Switch label={t('show_out_of_hours')} checked={showOutOfHours} onChange={setShowOutOfHours} />
                    <Switch label={t('show_cancelled')} checked={showCancelled} onChange={setShowCancelled} />
                </div>
                <Button variant="ghost" size="sm-compact" onClick={onPrint} icon={<Icon name="print" />}>{t('print')}</Button>
            </div>
        </header>
    );
};

export default DayScheduleHeader;

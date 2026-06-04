import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from '../modals/NextSlotCalendarModal.module.css';

export const DayListItem = ({ dayName, dateStr, dateLabel, isToday, inCount, outCount, includeOutOfHours, onClick }) => {
    const chipCount  = includeOutOfHours ? inCount + outCount : inCount;
    const isOutOnly  = inCount === 0 && outCount > 0;
    const chipVariant = isOutOnly ? 'amber' : 'green';

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className={`${styles.item} ${isToday ? styles.itemToday : ''} ${isOutOnly ? styles.itemOutOnly : ''}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            aria-label={`${dayName} ${dateLabel} — ${chipCount} turnos libres`}
        >
            <div className={styles.dateInfo}>
                <span className={styles.dayName}>{dayName}</span>
                <span className={styles.dateLabel}>{dateLabel}</span>
                {isToday && <span className={styles.todayBadge}>HOY</span>}
            </div>
            <div className={styles.chipGroup}>
                {isOutOnly && <Icon name="lock_open" size="0.85rem" className={styles.outIcon} />}
                <span className={`${styles.chip} ${styles[chipVariant === 'amber' ? 'chipAmber' : 'chipGreen']}`}>{chipCount}</span>
            </div>
        </div>
    );
};

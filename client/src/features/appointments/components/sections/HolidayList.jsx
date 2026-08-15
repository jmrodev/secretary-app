import React, { useMemo } from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatDate, compareDates } from '@/utils/core/dateUtils';
import styles from './HolidayList.module.css';

/**
 * HolidayList (Internal to feature).
 */
export const HolidayList = ({ holidays, onDelete }) => {
    const sortedHolidays = useMemo(() => {
        if (!holidays) return [];
        return holidays.toSorted((a, b) => compareDates(a.date, b.date));
    }, [holidays]);

    if (!sortedHolidays || sortedHolidays.length === 0) {
        return (
            <div className={`${styles.empty}`}>
                <Icon name="beach_access" size="3rem" className={`${styles.emptyIcon}`} />
                No hay feriados configurados.
            </div>
        );
    }

    return (
        <div className={`${styles.root}`}>
            {sortedHolidays.map(h => (
                <div key={h.id} className={`${styles.item} animate-fade-in`}>
                    <div className={`${styles.info}`}>
                        <span className={`${styles.date}`}>
                            <Icon name="calendar_today" size="0.9rem" />
                            {formatDate(h.date, { monthName: true })}
                        </span>
                        <div className={`${styles.description}`}>{h.description}</div>
                    </div>
                    <Button
                        variant="ghost" size="sm-compact" className={`${styles.deleteBtn}`}
                        onClick={() => onDelete(h.id)} icon={<Icon name="DELETE" size="1rem" />}
                    />
                </div>
            ))}
        </div>
    );
};


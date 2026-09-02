import React, { useMemo } from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
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
            <div className={`${styles.HolidayList__empty}`}>
                <Icon name="beach_access" size="3rem" className={`${styles.HolidayList__emptyIcon}`} />
                No hay feriados configurados.
            </div>
        );
    }

    return (
        <div className={`${styles.HolidayList__root}`}>
            {sortedHolidays.map(h => (
                <div key={h.id} className={`${styles.HolidayList__item} animate-fade-in`}>
                    <div className={`${styles.HolidayList__info}`}>
                        <span className={`${styles.HolidayList__date}`}>
                            <Icon name="calendar_today" size="0.9rem" />
                            {formatDate(h.date, { monthName: true })}
                        </span>
                        <div className={`${styles.HolidayList__description}`}>{h.description}</div>
                    </div>
                    <Button
                        variant="action-delete"
                        size="sm-compact"
                        onClick={() => onDelete(h.id)}
                        title="Eliminar"
                        icon={<Icon name="delete" size="1rem" />}
                    />
                </div>
            ))}
        </div>
    );
};


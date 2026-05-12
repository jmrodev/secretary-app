import React, { useMemo } from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import './HolidayList.css';

/**
 * HolidayList (Internal to feature).
 */
const HolidayList = ({ holidays, onDelete }) => {
    const sortedHolidays = useMemo(() => {
        if (!holidays) return [];
        return [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [holidays]);

    if (!sortedHolidays || sortedHolidays.length === 0) {
        return (
            <div className="holiday-list__empty">
                <Icon name="beach_access" size="3rem" className="holiday-list__empty-icon" />
                No hay feriados configurados.
            </div>
        );
    }

    return (
        <div className="holiday-list">
            {sortedHolidays.map(h => (
                <div key={h.id} className="holiday-list__item animate-fade-in">
                    <div className="holiday-list__info">
                        <span className="holiday-list__date">
                            <Icon name="calendar_today" size="0.9rem" />
                            {formatDate(h.date, { monthName: true })}
                        </span>
                        <div className="holiday-list__description">{h.description}</div>
                    </div>
                    <Button
                        variant="ghost" size="sm-compact" className="holiday-list__delete-btn"
                        onClick={() => onDelete(h.id)} icon={<Icon name="DELETE" size="1rem" />}
                    />
                </div>
            ))}
        </div>
    );
};

export default HolidayList;

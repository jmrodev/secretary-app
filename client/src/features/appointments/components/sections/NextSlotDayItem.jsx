import React from 'react';
import Icon from '@/components/atoms/Icon';

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
            className={`day-list__item${isToday ? ' day-list__item--today' : ''}${isOutOnly ? ' day-list__item--out-only' : ''}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            aria-label={`${dayName} ${dateLabel} — ${chipCount} turnos libres`}
        >
            <div className="day-list__date-info">
                <span className="day-list__day-name">{dayName}</span>
                <span className="day-list__date-label">{dateLabel}</span>
                {isToday && <span className="day-list__today-badge">HOY</span>}
            </div>
            <div className="day-list__chip-group">
                {isOutOnly && <Icon name="lock_open" size="0.85rem" className="day-list__out-icon" />}
                <span className={`day-list__chip day-list__chip--${chipVariant}`}>{chipCount}</span>
            </div>
        </div>
    );
};

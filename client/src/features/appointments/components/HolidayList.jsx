import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './HolidayList.css';

/**
 * HolidayList (Internal to feature).
 */
const HolidayList = ({ holidays, onDelete }) => {
    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    if (!holidays || holidays.length === 0) {
        return (
            <div className="holiday-list__empty">
                <Icon name="beach_access" size="3rem" className="holiday-list__empty-icon" />
                No hay feriados configurados.
            </div>
        );
    }

    return (
        <div className="holiday-list">
            {holidays
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(h => (
                    <div key={h.id} className="holiday-list__item animate-fadeIn">
                        <div className="holiday-list__info">
                            <span className="holiday-list__date">
                                <Icon name="calendar_today" size="0.9rem" />
                                {formatDate(h.date)}
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

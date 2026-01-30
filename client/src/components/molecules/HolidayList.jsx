import React from 'react';
import Button from '../atoms/Button';

const HolidayList = ({ holidays, onDelete }) => {
    const formatDate = (isoString) => {
        if (!isoString) return '';
        return isoString.split('T')[0];
    };

    const baseClass = 'holiday-list';

    if (!holidays || holidays.length === 0) {
        return (
            <div className={`${baseClass}__empty`}>
                No hay feriados configurados.
            </div>
        );
    }

    return (
        <div className={`${baseClass} ${baseClass}--grid`}>
            {holidays.map(h => (
                <div key={h.id} className={`${baseClass}__item`}>
                    <div className={`${baseClass}__info`}>
                        <span className={`${baseClass}__date`}>{formatDate(h.date)}</span>
                        <div className={`${baseClass}__description`}>{h.description}</div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        className="btn--danger"
                        onClick={() => onDelete(h.id)}
                        title="Eliminar"
                    >
                        🗑️
                    </Button>
                </div>
            ))}
        </div>
    );
};

export default HolidayList;

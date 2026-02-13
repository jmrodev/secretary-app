import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import './HolidayList.css';

const HolidayList = ({ holidays, onDelete }) => {
    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const baseClass = 'holiday-list';

    if (!holidays || holidays.length === 0) {
        return (
            <div className={`${baseClass}__empty`}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>🏝️</span>
                No hay feriados configurados.
            </div>
        );
    }

    return (
        <div className={baseClass}>
            {holidays
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(h => (
                    <div key={h.id} className={`${baseClass}__item animate-fadeIn`}>
                        <div className={`${baseClass}__info`}>
                            <span className={`${baseClass}__date`}>{formatDate(h.date)}</span>
                            <div className={`${baseClass}__description`}>{h.description}</div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm-compact"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => onDelete(h.id)}
                            title="Eliminar Feriado"
                            icon={<Icon name="DELETE" size="1rem" />}
                        />
                    </div>
                ))}
        </div>
    );
};

export default HolidayList;


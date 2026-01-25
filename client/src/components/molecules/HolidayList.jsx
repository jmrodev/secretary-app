import React from 'react';
import { useModal } from '../../context/ModalContext';

const HolidayList = ({ holidays, onDelete }) => {
    const { confirm } = useModal();

    const handleDelete = async (id) => {
        if (!await confirm("¿Eliminar este feriado?")) return;
        onDelete(id);
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return isoString.split('T')[0];
    };

    if (holidays.length === 0) {
        return (
            <div className="text-center py-12 text-muted italic bg-slate-50 rounded-xl border border-dashed">
                No hay feriados configurados.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holidays.map(h => (
                <div key={h.id} className="holiday-list-item">
                    <div>
                        <span className="font-bold text-main-800">{formatDate(h.date)}</span>
                        <div className="text-sm text-muted">{h.description}</div>
                    </div>
                    <button onClick={() => handleDelete(h.id)} className="btn-text-danger" title="Eliminar">
                        🗑️
                    </button>
                </div>
            ))}
        </div>
    );
};

export default HolidayList;

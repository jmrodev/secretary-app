import React, { useState } from 'react';

const HolidayForm = ({ onAdd }) => {
    const [newDate, setNewDate] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await onAdd(newDate, newDesc);
        if (success) {
            setNewDate('');
            setNewDesc('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="input-group">
                <label className="input-label">Fecha</label>
                <input type="date" className="input-field" value={newDate} onChange={e => setNewDate(e.target.value)} required />
            </div>
            <div className="input-group">
                <label className="input-label">Descripción</label>
                <input type="text" className="input-field" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ej. Navidad" required />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2">✨ Agregar Feriado</button>
        </form>
    );
};

export default HolidayForm;

import React, { useState } from 'react';
import Button from '../atoms/Button';
import FormGroup from '../molecules/FormGroup';
import Input from '../atoms/Input';

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
        <form onSubmit={handleSubmit} className="form">
            <FormGroup label="Fecha" required>
                <Input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                />
            </FormGroup>

            <FormGroup label="Descripción" required>
                <Input
                    type="text"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Ej. Navidad"
                    required
                />
            </FormGroup>

            <Button type="submit" variant="primary" className="w-full mt-2">
                ✨ Agregar Feriado
            </Button>
        </form>
    );
};

export default HolidayForm;

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import FormGroup from '@/components/molecules/FormGroup';
import Input from '@/components/atoms/Input';
import { capitalizeFirst } from '@/utils/core/stringUtils';

/**
 * HolidayForm (Internal to feature).
 */
const HolidayForm = ({ onAdd, t: _t }) => {
    const [newDate, setNewDate] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (await onAdd(newDate, newDesc)) { setNewDate(''); setNewDesc(''); }
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <FormGroup label="Fecha" required>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
            </FormGroup>
            <FormGroup label="Descripción" required>
                <Input
                    type="text" value={newDesc} onChange={e => setNewDesc(capitalizeFirst(e.target.value))}
                    placeholder="Ej. Navidad" required
                />
            </FormGroup>
            <Button type="submit" variant="primary" className="w-full mt-2" icon={<Icon name="auto_awesome" size="1.1rem" />}>
                Agregar Feriado
            </Button>
        </form>
    );
};

export default HolidayForm;

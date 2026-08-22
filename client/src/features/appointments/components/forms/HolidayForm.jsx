import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { FormGroup } from '@/components/molecules/FormGroup';
import { Input } from '@/components/atoms/Input';
import { useLanguage } from '@/hooks/useLanguage';
import { capitalizeFirst } from '@/utils/core/stringUtils';

/**
 * HolidayForm (Internal to feature).
 */
export const HolidayForm = ({ onAdd, t: propT }) => {
    const { t: hookT } = useLanguage();
    const t = propT || hookT;
    const [newDate, setNewDate] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (await onAdd(newDate, newDesc)) { setNewDate(''); setNewDesc(''); }
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <FormGroup label={t('date') || 'Fecha'} required>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
            </FormGroup>
            <FormGroup label={t('description') || 'Descripción'} required>
                <Input
                    type="text" value={newDesc} onChange={e => setNewDesc(capitalizeFirst(e.target.value))}
                    placeholder={t('holiday_desc_placeholder') || 'Ej. Navidad'} required
                />
            </FormGroup>
            <Button type="submit" variant="primary" className="w-full mt-2" icon={<Icon name="auto_awesome" size="1.1rem" />}>
                {t('add_holiday') || 'Agregar Feriado'}
            </Button>
        </form>
    );
};


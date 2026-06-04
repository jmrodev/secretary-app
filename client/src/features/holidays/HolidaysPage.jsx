import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useHolidays } from '@/features/appointments/hooks/useHolidays';
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import HolidayList from '@/features/appointments/components/sections/HolidayList';
import Input from '@/components/atoms/Input';
import styles from './HolidaysPage.module.css';

export const HolidaysPage = () => {
    const { t } = useLanguage();
    const { holidays, addHoliday, deleteHoliday, loading } = useHolidays();
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!date) return;
        await addHoliday(date, description);
        setDate('');
        setDescription('');
    };

    return (
        <MainLayout wide flush title={t('holidays') || 'Feriados y Días No Laborables'}>
            <div className={styles.root}>

                <div className={styles.content}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Agregar Feriado</h3>
                        <form onSubmit={handleAdd} className={styles.form}>
                            <Input 
                                type="date" 
                                label="Fecha" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                required 
                            />
                            <Input 
                                type="text" 
                                label="Descripción (Opcional)" 
                                placeholder="Ej: Año Nuevo, Feriado Nacional..."
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                            />
                            <Button type="submit" variant="primary" icon={<Icon name="add" />}>
                                Agregar
                            </Button>
                        </form>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Feriados Registrados</h3>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando…</div>
                        ) : (
                            <HolidayList holidays={holidays} onDelete={deleteHoliday} />
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

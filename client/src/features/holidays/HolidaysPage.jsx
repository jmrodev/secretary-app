import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useHolidays } from '@/features/appointments/hooks/useHolidays';
import { MainLayout } from '@/components/templates/MainLayout';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { HolidayList } from '@/features/appointments/components/sections/HolidayList';
import { Input } from '@/components/atoms/Input';
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
        <MainLayout wide flush title={t('holidays')}>
            <div className={styles.HolidaysPage__root}>

                <div className={styles.HolidaysPage__content}>
                    <div className={styles.HolidaysPage__card}>
                        <h3 className={styles.HolidaysPage__cardTitle}>{t('add_holiday')}</h3>
                        <form onSubmit={handleAdd} className={styles.HolidaysPage__form}>
                            <Input 
                                type="date" 
                                label={t('date')} 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                required 
                            />
                            <Input 
                                type="text" 
                                label={t('description_optional')} 
                                placeholder={t('holiday_example_placeholder')}
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                            />
                            <Button type="submit" variant="primary" icon={<Icon name="add" />}>
                                {t('add')}
                            </Button>
                        </form>
                    </div>

                    <div className={styles.HolidaysPage__card}>
                        <h3 className={styles.HolidaysPage__cardTitle}>{t('registered_holidays')}</h3>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>{t('loading')}</div>
                        ) : (
                            <HolidayList holidays={holidays} onDelete={deleteHoliday} />
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

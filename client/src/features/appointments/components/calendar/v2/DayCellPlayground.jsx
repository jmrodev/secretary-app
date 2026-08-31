import React, { useState } from 'react';
import { DayCell } from './DayCell';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './DayCellPlayground.module.css';

const sampleDays = [
    {
      id: 1,
      day: 1,
      isCurrentMonth: false,
      isPast: true,
      appointmentsCount: 0
    },
    {
      id: 2,
      day: 2,
      isCurrentMonth: false,
      isPast: true,
      appointmentsCount: 0
    },
    {
      id: 3,
      day: 12,
      isCurrentMonth: true,
      isPast: true,
      appointmentsCount: 4 // Medium load
    },
    {
      id: 4,
      day: 13,
      isCurrentMonth: true,
      isPast: true,
      isHoliday: true,
      holidayName: 'Día de la Independencia'
    },
    {
      id: 5,
      day: 14,
      isCurrentMonth: true,
      isPast: false,
      isToday: true,
      appointmentsCount: 1 // Low load
    },
    {
      id: 6,
      day: 15,
      isCurrentMonth: true,
      isPast: false,
      appointmentsCount: 8 // High load
    },
    {
      id: 7,
      day: 16,
      isCurrentMonth: true,
      isPast: false,
      appointmentsCount: 0
    }
];

/**
 * DayCellPlayground (Molecule/Section Component)
 * Showcases all possible states of our atomic DayCell component
 * to demonstrate how it can be replicated with different data inputs.
 */
export const DayCellPlayground = () => {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState(15);

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  return (
    <div className={styles.DayCellPlayground__playground}>
      <header className={styles.DayCellPlayground__header}>
        <h3 className={styles.DayCellPlayground__title}>{t('daycell_playground_title')}</h3>
        <p className={styles.DayCellPlayground__subtitle}>
          {t('daycell_playground_subtitle')}
        </p>
      </header>

      <section className={styles.DayCellPlayground__grid}>
        {sampleDays.map((item) => (
          <div key={item.id} className={styles.DayCellPlayground__cellWrapper}>
            <span className={styles.DayCellPlayground__label}>
              {item.isToday && (t('today'))}
              {item.isHoliday && (t('holiday'))}
              {!item.isCurrentMonth && (t('previous_month'))}
              {item.isPast && !item.isToday && !item.isHoliday && (t('past'))}
              {!item.isPast && !item.isToday && !item.isHoliday && item.isCurrentMonth && (t('future'))}
            </span>
            <DayCell
              day={item.day}
              isSelected={selectedDay === item.day}
              isToday={item.isToday}
              isCurrentMonth={item.isCurrentMonth}
              isHoliday={item.isHoliday}
              holidayName={item.holidayName}
              isPast={item.isPast}
              appointmentsCount={item.appointmentsCount}
              onClick={handleDayClick}
            />
          </div>
        ))}
      </section>

      <footer className={styles.DayCellPlayground__footer}>
        <span className={styles.DayCellPlayground__footerText}>
          {t('selected_day_label')}: <strong className={styles.DayCellPlayground__highlight}>{selectedDay}</strong>
        </span>
      </footer>
    </div>
  );
};


import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/atoms/Button';
import { ScheduleBulkActions } from '@/features/appointments/components/schedule/ScheduleBulkActions';
import { ScheduleTimeBlock } from '@/features/appointments/components/schedule/ScheduleTimeBlock';

import styles from './DoctorScheduleSettings.module.css';

const EMPTY_SCHEDULE = [];
const DAYS = [
    { id: 1, nameKey: 'day_monday' },
    { id: 2, nameKey: 'day_tuesday' },
    { id: 3, nameKey: 'day_wednesday' },
    { id: 4, nameKey: 'day_thursday' },
    { id: 5, nameKey: 'day_friday' },
    { id: 6, nameKey: 'day_saturday' },
    { id: 0, nameKey: 'day_sunday' }
];

/**
 * DoctorScheduleSettings Organism.
 * Provides a specialized interface for configuring a doctor's weekly work schedule.
 */
export const DoctorScheduleSettings = ({
    doctorId: _doctorId,
    schedule = EMPTY_SCHEDULE,
    setSchedule,
    loading
}) => {
    const { t } = useLanguage();
    const [focusedIndex, setFocusedIndex] = useState(null);

    // Guard: the parent may omit setSchedule (e.g. read-only / preview mounts).
    // Degrade to a no-op instead of throwing "setSchedule is not a function".
    const setScheduleSafe = useMemo(
        () => (typeof setSchedule === 'function' ? setSchedule : () => {}),
        [setSchedule]
    );

    // Initialize schedule with unique keys if missing
    useEffect(() => {
        if (Array.isArray(schedule) && schedule.length > 0) {
            const needsKeys = schedule.some(s => !s._key);
            if (needsKeys) {
                const withKeys = schedule.map((s, idx) => ({
                    ...s,
                    _key: s._key || s.id || `new-${Date.now()}-${idx}`
                }));
                if (JSON.stringify(withKeys) !== JSON.stringify(schedule)) {
                    setScheduleSafe(withKeys);
                }
            }
        }
    }, [schedule, setScheduleSafe]);

    const handleAddBlock = (dayId) => {
        setScheduleSafe(prev => [
            ...prev,
            {
                _key: `new-${Date.now()}`,
                day_of_week: dayId,
                start_time: '14:00',
                end_time: '18:00',
                is_break: 0,
                default_type: 'consultation'
            }
        ]);
    };

    const handleRemoveBlock = (indexToRemove) => {
        setScheduleSafe(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleBlockChange = (index, field, value) => {
        setScheduleSafe(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
    };

    const toggleDay = (dayId) => {
        setScheduleSafe(prev => {
            const hasDay = prev.some(s => s.day_of_week === dayId);
            if (hasDay) {
                return prev.filter(s => s.day_of_week !== dayId);
            } else {
                return [...prev, {
                    day_of_week: dayId,
                    start_time: '08:00',
                    end_time: '20:00',
                    is_break: 0,
                    default_type: 'consultation'
                }];
            }
        });
    };

    const [bulkStart, setBulkStart] = useState('08:00');
    const [bulkEnd, setBulkEnd] = useState('20:00');

    const applyBulk = (daysToApply) => {
        const daysToApplySet = new Set(daysToApply);
        setScheduleSafe(prev => {
            let newSched = prev.filter(s => !daysToApplySet.has(s.day_of_week));
            daysToApply.forEach(dayId => {
                newSched.push({
                    day_of_week: dayId,
                    start_time: bulkStart,
                    end_time: bulkEnd,
                    is_break: 0,
                    default_type: 'consultation'
                });
            });
            return newSched;
        });
    };

    if (loading) return <div className={`${styles.DoctorScheduleSettings__loading}`}>{t('loading_schedules')}</div>;

    return (
        <section className={`${styles.DoctorScheduleSettings__scheduleSettings}`}>
            <header className={styles.DoctorScheduleSettings__header}>
                <h3 className={`${styles.DoctorScheduleSettings__title}`}>{t('doctor_schedule_settings_title')}</h3>
                <p className={`${styles.DoctorScheduleSettings__desc}`}>{t('doctor_schedule_settings_desc')}</p>
            </header>

            <ScheduleBulkActions
                bulkStart={bulkStart}
                setBulkStart={setBulkStart}
                bulkEnd={bulkEnd}
                setBulkEnd={setBulkEnd}
                onApplyBulk={applyBulk}
                t={t}
            />

            <div className={`${styles.DoctorScheduleSettings__days}`}>
                {DAYS.map(day => {
                    const dayBlocks = (Array.isArray(schedule) ? schedule : []).reduce((acc, s, idx) => {
                        if (s.day_of_week === day.id) {
                            acc.push({ ...s, originalIndex: idx });
                        }
                        return acc;
                    }, []);

                    if (focusedIndex === null) {
                        dayBlocks.sort((a, b) => {
                            const timeA = String(a.start_time || '00:00');
                            const timeB = String(b.start_time || '00:00');
                            return timeA.localeCompare(timeB);
                        });
                    }

                    const isActive = dayBlocks.length > 0;

                    return (
                        <article key={day.id} className={`${styles.DoctorScheduleSettings__scheduleDay} ${isActive ? styles['DoctorScheduleSettings__scheduleDay--active'] : ''}`}>
                            <div className={`${styles.DoctorScheduleSettings__header}`}>
                                <header className={`${styles.DoctorScheduleSettings__toggle}`}>
                                    <input
                                        type="checkbox"
                                        id={`day-${day.id}`}
                                        checked={isActive}
                                        onChange={() => toggleDay(day.id)}
                                        className={`${styles.DoctorScheduleSettings__checkbox}`}
                                    />
                                </header>
                                <div className={`${styles.DoctorScheduleSettings__content}`}>
                                    <label htmlFor={`day-${day.id}`} className={`${styles.DoctorScheduleSettings__name}`}>
                                        {t(day.nameKey)}
                                    </label>

                                    {isActive && (
                                        <div className={`${styles.DoctorScheduleSettings__scheduleBlocks}`}>
                                            {dayBlocks.map((block) => (
                                                <ScheduleTimeBlock
                                                    key={block._key || block.originalIndex}
                                                    block={block}
                                                    onFocus={() => setFocusedIndex(block.originalIndex)}
                                                    onBlur={() => setFocusedIndex(null)}
                                                    onChange={handleBlockChange}
                                                    onRemove={() => handleRemoveBlock(block.originalIndex)}
                                                    t={t}
                                                />
                                            ))}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAddBlock(day.id)}
                                                className={`${styles.DoctorScheduleSettings__addBtn}`}
                                                icon="+"
                                            >
                                                {t('add_extra_block')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};



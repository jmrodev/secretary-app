import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/atoms/Button';
import { ScheduleBulkActions } from '@/features/appointments/components/schedule/ScheduleBulkActions';
import { ScheduleTimeBlock } from '@/features/appointments/components/schedule/ScheduleTimeBlock';

import styles from './DoctorScheduleSettings.module.css';

const EMPTY_SCHEDULE = [];
const DAYS = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' }
];

const NOOP = () => {};

/**
 * DoctorScheduleSettings Organism.
 * Provides a specialized interface for configuring a doctor's weekly work schedule.
 */
export const DoctorScheduleSettings = ({
    doctorId: _doctorId,
    schedule = EMPTY_SCHEDULE,
    setSchedule = NOOP,
    loading
}) => {
    const { t } = useLanguage();
    const [focusedKey, setFocusedKey] = useState(null);

    const safeSetSchedule = typeof setSchedule === 'function' ? setSchedule : NOOP;

    // Initialize schedule with unique keys if missing
    useEffect(() => {
        if (Array.isArray(schedule) && schedule.length > 0) {
            const needsKeys = schedule.some(s => !s._key);
            if (needsKeys) {
                const withKeys = schedule.map((s, idx) => ({
                    ...s,
                    _key: s._key || (s.id ? `sched-${s.id}` : `sched-init-${idx}-${Date.now()}`)
                }));
                safeSetSchedule(withKeys);
            }
        }
    }, [schedule, safeSetSchedule]);

    const handleAddBlock = (dayId) => {
        safeSetSchedule(prev => [
            ...(Array.isArray(prev) ? prev : []),
            {
                _key: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                day_of_week: dayId,
                start_time: '14:00',
                end_time: '18:00',
                is_break: 0,
                default_type: 'consultation',
                force_hour_alignment: 0
            }
        ]);
    };

    const handleRemoveBlock = (keyToRemove) => {
        safeSetSchedule(prev => (Array.isArray(prev) ? prev : []).filter(s => s._key !== keyToRemove));
    };

    const handleBlockChange = (key, field, value) => {
        safeSetSchedule(prev => (Array.isArray(prev) ? prev : []).map(s => (s._key === key ? { ...s, [field]: value } : s)));
    };

    const toggleDay = (dayId) => {
        safeSetSchedule(prev => {
            const list = Array.isArray(prev) ? prev : [];
            const hasDay = list.some(s => Number(s.day_of_week) === Number(dayId));
            if (hasDay) {
                return list.filter(s => Number(s.day_of_week) !== Number(dayId));
            }
            return [
                ...list,
                {
                    _key: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    day_of_week: Number(dayId),
                    start_time: '08:00',
                    end_time: '20:00',
                    is_break: 0,
                    default_type: 'consultation',
                    force_hour_alignment: 0
                }
            ];
        });
    };

    const [bulkStart, setBulkStart] = useState('08:00');
    const [bulkEnd, setBulkEnd] = useState('20:00');

    const applyBulk = (daysToApply) => {
        const daysToApplySet = new Set(daysToApply.map(Number));
        safeSetSchedule(prev => {
            const list = Array.isArray(prev) ? prev : [];
            const newSched = list.filter(s => !daysToApplySet.has(Number(s.day_of_week)));
            daysToApply.forEach(dayId => {
                newSched.push({
                    _key: `block-${Date.now()}-${dayId}-${Math.random().toString(36).slice(2, 7)}`,
                    day_of_week: Number(dayId),
                    start_time: bulkStart,
                    end_time: bulkEnd,
                    is_break: 0,
                    default_type: 'consultation',
                    force_hour_alignment: 0
                });
            });
            return newSched;
        });
    };

    if (loading) return <div className={`${styles.DoctorScheduleSettings__loading}`}>{t('loading_schedules')}</div>;

    return (
        <section className={`${styles.DoctorScheduleSettings__scheduleSettings}`}>
            <header className="schedule-settings__header">
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
                    const dayBlocks = (Array.isArray(schedule) ? schedule : [])
                        .filter(s => Number(s.day_of_week) === Number(day.id))
                        .map((s, idx) => ({
                            ...s,
                            _key: s._key || (s.id ? `sched-${s.id}` : `sched-dyn-${day.id}-${idx}`)
                        }));

                    if (focusedKey === null) {
                        dayBlocks.sort((a, b) => {
                            const timeA = String(a.start_time || '00:00');
                            const timeB = String(b.start_time || '00:00');
                            return timeA.localeCompare(timeB);
                        });
                    }

                    const isActive = dayBlocks.length > 0;

                    return (
                        <article key={day.id} className={`${styles.DoctorScheduleSettings__scheduleDay} ${isActive ? styles.DoctorScheduleSettings__scheduleDayActive : ''}`}>
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
                                        {day.name}
                                    </label>

                                    {isActive && (
                                        <div className={`${styles.DoctorScheduleSettings__scheduleBlocks}`}>
                                            {dayBlocks.map((block) => (
                                                <ScheduleTimeBlock
                                                    key={block._key}
                                                    block={block}
                                                    onFocus={() => setFocusedKey(block._key)}
                                                    onBlur={() => setFocusedKey(null)}
                                                    onChange={handleBlockChange}
                                                    onRemove={() => handleRemoveBlock(block._key)}
                                                    t={t}
                                                />
                                            ))}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAddBlock(day.id)}
                                                className={`${styles.DoctorScheduleSettings__addBtn}`}
                                            >
                                                + {t('add_time_slot')}
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

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/atoms/Button';

// Molecules
import ScheduleBulkActions from '../../appointments/components/ScheduleBulkActions';
import ScheduleTimeBlock from '../../appointments/components/ScheduleTimeBlock';

import './DoctorScheduleSettings.css';

/**
 * DoctorScheduleSettings Organism.
 * Provides a specialized interface for configuring a doctor's weekly work schedule.
 */
const DoctorScheduleSettings = ({ doctorId, schedule = [], setSchedule, loading }) => {
    const { t } = useLanguage();
    const [focusedIndex, setFocusedIndex] = useState(null);

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
                    setSchedule(withKeys);
                }
            }
        }
    }, [schedule, setSchedule]);

    const DAYS = [
        { id: 1, name: 'Lunes' },
        { id: 2, name: 'Martes' },
        { id: 3, name: 'Miércoles' },
        { id: 4, name: 'Jueves' },
        { id: 5, name: 'Viernes' },
        { id: 6, name: 'Sábado' },
        { id: 0, name: 'Domingo' }
    ];

    const handleAddBlock = (dayId) => {
        setSchedule(prev => [
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
        setSchedule(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleBlockChange = (index, field, value) => {
        setSchedule(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
    };

    const toggleDay = (dayId) => {
        setSchedule(prev => {
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
        setSchedule(prev => {
            let newSched = prev.filter(s => !daysToApply.includes(s.day_of_week));
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

    if (loading) return <div className="schedule-settings__loading">Cargando horarios...</div>;

    return (
        <div className="schedule-settings">
            <h3 className="schedule-settings__title">Configuración de Horarios de Atención</h3>
            <p className="schedule-settings__desc">Defina los días y franjas horarias en las que este médico atiende.</p>

            <ScheduleBulkActions
                bulkStart={bulkStart}
                setBulkStart={setBulkStart}
                bulkEnd={bulkEnd}
                setBulkEnd={setBulkEnd}
                onApplyBulk={applyBulk}
                t={t}
            />

            <div className="schedule-settings__days">
                {DAYS.map(day => {
                    const dayBlocks = (Array.isArray(schedule) ? schedule : [])
                        .map((s, idx) => ({ ...s, originalIndex: idx }))
                        .filter(s => s.day_of_week === day.id);

                    if (focusedIndex === null) {
                        dayBlocks.sort((a, b) => {
                            const timeA = String(a.start_time || '00:00');
                            const timeB = String(b.start_time || '00:00');
                            return timeA.localeCompare(timeB);
                        });
                    }

                    const isActive = dayBlocks.length > 0;

                    return (
                        <div key={day.id} className={`schedule-day ${isActive ? 'schedule-day--active' : ''}`}>
                            <div className="schedule-day__header">
                                <div className="schedule-day__toggle">
                                    <input
                                        type="checkbox"
                                        id={`day-${day.id}`}
                                        checked={isActive}
                                        onChange={() => toggleDay(day.id)}
                                        className="schedule-day__checkbox"
                                    />
                                </div>
                                <div className="schedule-day__content">
                                    <label htmlFor={`day-${day.id}`} className="schedule-day__name">
                                        {day.name}
                                    </label>

                                    {isActive && (
                                        <div className="schedule-blocks">
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
                                                className="schedule-blocks__add-btn"
                                                icon="+"
                                            >
                                                {t('add_extra_block') || 'Agregar Turno Cortado / Extra'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DoctorScheduleSettings;

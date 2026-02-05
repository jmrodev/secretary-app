import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { useMessage } from '../../context/MessageContext';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import './DoctorScheduleSettings.css';

const DoctorScheduleSettings = ({ doctorId, schedule = [], setSchedule, loading }) => {
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { showMessage } = useMessage();
    const [updatingBulk, setUpdatingBulk] = useState(false);
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
                // Only update if something changed to avoid loop
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

    const handleBulkUpdateType = async (dayId, type) => {
        const dayName = DAYS.find(d => d.id == dayId).name;
        const typeName = type === 'virtual' ? 'VIDEOLLAMADA' : 'PRESENCIAL';

        try {
            setUpdatingBulk(true);
            const res = await api.post('/appointments/bulk-update-type', {
                dayOfWeek: dayId,
                type: type,
                doctorId: doctorId
            });
            showMessage(res.data.message, 'success');
        } catch (err) {
            console.error(err);
            showMessage('Error al actualizar turnos', 'error');
        } finally {
            setUpdatingBulk(false);
        }
    };

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
                // Remove all blocks for this day
                return prev.filter(s => s.day_of_week !== dayId);
            } else {
                // Add initial block
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
            // Keep days NOT in the bulk list
            let newSched = prev.filter(s => !daysToApply.includes(s.day_of_week));

            // Add new single block for each bulk day
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

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando horarios...</div>;

    return (
        <div className="schedule-settings">
            <h3 className="schedule-settings__title">Configuración de Horarios de Atención</h3>
            <p className="schedule-settings__desc">Defina los días y franjas horarias en las que este médico atiende.</p>

            {/* Bulk Actions */}
            <div className="schedule-bulk">
                <h4 className="schedule-bulk__title">Aplicar a múltiples días (Sobrescribe horarios)</h4>
                <div className="config-flex config-flex--gap-4" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="config-flex config-flex--gap-2" style={{ alignItems: 'center' }}>
                        <input
                            type="time"
                            className="input-field"
                            style={{ width: '110px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                            value={bulkStart}
                            onChange={(e) => setBulkStart(e.target.value)}
                        />
                        <span style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>a</span>
                        <input
                            type="time"
                            className="input-field"
                            style={{ width: '110px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                            value={bulkEnd}
                            onChange={(e) => setBulkEnd(e.target.value)}
                        />
                    </div>
                    <div className="config-flex config-flex--gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyBulk([1, 2, 3, 4, 5])}
                        >
                            Lunes a Viernes
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyBulk([1, 2, 3, 4, 5, 6])}
                        >
                            Lunes a Sábado
                        </Button>
                    </div>
                </div>
            </div>

            <div className="config-flex config-flex--column config-flex--gap-4">
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
                                <div style={{ paddingTop: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id={`day-${day.id}`}
                                        checked={isActive}
                                        onChange={() => toggleDay(day.id)}
                                        className="schedule-day__checkbox"
                                    />
                                </div>
                                <div className="config-flex__item--grow">
                                    <label htmlFor={`day-${day.id}`} className="schedule-day__name">
                                        {day.name}
                                    </label>

                                    {isActive && (
                                        <div className="schedule-blocks">
                                            {dayBlocks.map((block) => (
                                                <div key={block._key || block.originalIndex} className="time-block">
                                                    <div className="time-block__inputs">
                                                        <Input
                                                            type="time"
                                                            size="sm"
                                                            value={String(block.start_time || '').slice(0, 5)}
                                                            onFocus={() => setFocusedIndex(block.originalIndex)}
                                                            onBlur={() => setFocusedIndex(null)}
                                                            onChange={(e) => handleBlockChange(block.originalIndex, 'start_time', e.target.value)}
                                                        />
                                                        <span style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>a</span>
                                                        <Input
                                                            type="time"
                                                            size="sm"
                                                            value={String(block.end_time || '').slice(0, 5)}
                                                            onFocus={() => setFocusedIndex(block.originalIndex)}
                                                            onBlur={() => setFocusedIndex(null)}
                                                            onChange={(e) => handleBlockChange(block.originalIndex, 'end_time', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="time-block__separator"></div>

                                                    <div>
                                                        <select
                                                            className={`time-block__type-select ${block.default_type === 'virtual' ? 'time-block__type-select--virtual' : ''}`}
                                                            value={block.default_type || 'consultation'}
                                                            onChange={(e) => {
                                                                handleBlockChange(block.originalIndex, 'default_type', e.target.value);
                                                            }}
                                                        >
                                                            <option value="consultation">🏥 Presencial</option>
                                                            <option value="virtual">📹 Videollamada</option>
                                                        </select>
                                                    </div>

                                                    <div style={{ marginLeft: '0.5rem' }}>
                                                        <label className="time-block__alignment">
                                                            <input
                                                                type="checkbox"
                                                                style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                                                                checked={block.force_hour_alignment === 1}
                                                                onChange={(e) => handleBlockChange(block.originalIndex, 'force_hour_alignment', e.target.checked ? 1 : 0)}
                                                            />
                                                            <span className="time-block__alignment-text">🕒 Coord. :00</span>
                                                        </label>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm-compact"
                                                        onClick={() => handleRemoveBlock(block.originalIndex)}
                                                        className="time-block__remove"
                                                        title="Eliminar franja"
                                                    >
                                                        🗑️
                                                    </Button>
                                                </div>
                                            ))}

                                            <Button
                                                variant="ghost"
                                                onClick={() => handleAddBlock(day.id)}
                                                style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                                className="config-flex config-flex--gap-1"
                                            >
                                                <span>+</span> Agregar Turno Cortado / Extra
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

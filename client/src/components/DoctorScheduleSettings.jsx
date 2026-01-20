import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useMessage } from '../context/MessageContext';

const DoctorScheduleSettings = ({ doctorId, schedule, setSchedule, loading }) => {
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { showMessage } = useMessage();
    const [updatingBulk, setUpdatingBulk] = useState(false);

    const handleBulkUpdateType = async (dayId, type) => {
        const dayName = DAYS.find(d => d.id == dayId).name;
        const typeName = type === 'virtual' ? 'VIDEOLLAMADA' : 'PRESENCIAL';

        // Note: we don't ask for confirmation here because handleToggleVirtual already did
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

    const handleToggleVirtual = async (dayId) => {
        const config = schedule.find(s => s.day_of_week === dayId);
        if (!config) return;

        const isCurrentlyVirtual = config.default_type === 'virtual';
        const newType = isCurrentlyVirtual ? 'consultation' : 'virtual';

        // Update local state
        handleDayChange(dayId, 'default_type', newType);

        // Bulk update question
        const actionName = newType === 'virtual' ? 'VIDEOLLAMADA' : 'PRESENCIAL';
        const dayName = DAYS.find(d => d.id == dayId).name;

        if (await confirm(`Has configurado los ${dayName}s como día de ${actionName}. ¿Deseas convertir todos los turnos ya agendados para este día a ${actionName}?`)) {
            handleBulkUpdateType(dayId, newType);
        }
    };

    const DAYS = [
        { id: 1, name: 'Lunes' },
        { id: 2, name: 'Martes' },
        { id: 3, name: 'Miércoles' },
        { id: 4, name: 'Jueves' },
        { id: 5, name: 'Viernes' },
        { id: 6, name: 'Sábado' },
        { id: 0, name: 'Domingo' }
    ];

    const handleDayChange = (dayId, field, value) => {
        setSchedule(prev => {
            // Check if day exists in schedule array
            const exists = prev.find(s => s.day_of_week === dayId);
            if (exists) {
                // Update
                return prev.map(s => s.day_of_week === dayId ? { ...s, [field]: value } : s);
            } else {
                // Add new (default 8-20 if no time set yet)
                return [...prev, {
                    day_of_week: dayId,
                    start_time: '08:00',
                    end_time: '20:00',
                    is_break: 0,
                    [field]: value
                }];
            }
        });
    };

    const toggleDay = (dayId) => {
        setSchedule(prev => {
            const exists = prev.find(s => s.day_of_week === dayId);
            if (exists) {
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
            let newSched = [...prev];
            daysToApply.forEach(dayId => {
                const existing = newSched.find(s => s.day_of_week === dayId);
                const block = {
                    day_of_week: dayId,
                    start_time: bulkStart,
                    end_time: bulkEnd,
                    is_break: 0,
                    default_type: existing?.default_type || 'consultation'
                };
                if (existing) {
                    const idx = newSched.indexOf(existing);
                    newSched[idx] = block;
                } else {
                    newSched.push(block);
                }
            });
            return newSched;
        });
    };

    if (loading) return <div>Cargando horarios...</div>;

    return (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <h3 className="text-lg font-bold text-main-800 mb-4">Configuración de Horarios de Atención</h3>
            <p className="text-sm text-main-500 mb-6">Defina los días y franjas horarias en las que este médico atiende. El sistema utilizará esto para buscar turnos libres.</p>

            {/* Bulk Actions */}
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                <h4 className="text-sm font-bold text-main-700 mb-3">Aplicar a múltiples días</h4>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="time"
                            className="input-field py-1 px-2 w-28 text-sm"
                            value={bulkStart}
                            onChange={(e) => setBulkStart(e.target.value)}
                        />
                        <span className="text-muted">a</span>
                        <input
                            type="time"
                            className="input-field py-1 px-2 w-28 text-sm"
                            value={bulkEnd}
                            onChange={(e) => setBulkEnd(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => applyBulk([1, 2, 3, 4, 5])}
                        >
                            Lunes a Viernes
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => applyBulk([1, 2, 3, 4, 5, 6])}
                        >
                            Lunes a Sábado
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {DAYS.map(day => {
                    const config = schedule.find(s => s.day_of_week === day.id);
                    const isActive = !!config;

                    return (
                        <div key={day.id} className={`flex items-center gap-4 p-3 rounded-md border ${isActive ? 'border-primary-200 bg-primary-50/30' : 'border-slate-100 bg-slate-50'}`}>
                            <div className="flex items-center gap-4 min-w-[300px]">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`day-${day.id}`}
                                        className="w-4 h-4 text-primary-600 rounded"
                                        checked={isActive}
                                        onChange={() => toggleDay(day.id)}
                                    />
                                    <label htmlFor={`day-${day.id}`} className={`font-medium cursor-pointer w-24 ${isActive ? 'text-main-900' : 'text-muted'}`}>
                                        {day.name}
                                    </label>
                                </div>
                                {isActive && (
                                    <div className="flex items-center gap-2" title="Configurar día como Videollamada">
                                        <input
                                            type="checkbox"
                                            id={`virtual-${day.id}`}
                                            className="w-4 h-4 text-accent-color rounded cursor-pointer"
                                            checked={config.default_type === 'virtual'}
                                            onChange={() => handleToggleVirtual(day.id)}
                                        />
                                        <label htmlFor={`virtual-${day.id}`} className="text-sm cursor-pointer whitespace-nowrap">📹 Videollamada</label>
                                    </div>
                                )}
                            </div>

                            {isActive && (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="time"
                                        className="input-field py-1 px-2 w-28 text-sm"
                                        value={config.start_time ? config.start_time.slice(0, 5) : ''}
                                        onChange={(e) => handleDayChange(day.id, 'start_time', e.target.value)}
                                    />
                                    <span className="text-muted">a</span>
                                    <input
                                        type="time"
                                        className="input-field py-1 px-2 w-28 text-sm"
                                        value={config.end_time ? config.end_time.slice(0, 5) : ''}
                                        onChange={(e) => handleDayChange(day.id, 'end_time', e.target.value)}
                                    />
                                </div>
                            )}
                            {!isActive && <div className="text-xs text-muted italic">No atiende</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DoctorScheduleSettings;

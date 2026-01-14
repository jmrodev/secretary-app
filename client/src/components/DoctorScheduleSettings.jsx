import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';

const DoctorScheduleSettings = ({ doctorId, onSave }) => {
    const { t } = useLanguage();
    const { alert } = useModal();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    const DAYS = [
        { id: 1, name: 'Lunes' },
        { id: 2, name: 'Martes' },
        { id: 3, name: 'Miércoles' },
        { id: 4, name: 'Jueves' },
        { id: 5, name: 'Viernes' },
        { id: 6, name: 'Sábado' },
        { id: 0, name: 'Domingo' }
    ];

    useEffect(() => {
        if (doctorId) fetchSchedule();
    }, [doctorId]);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/schedules/${doctorId}`);
            // Transform to easier format
            // We want one entry per day, even if empty
            const loaded = res.data; // [{day_of_week: 1, start_time: '08:00', ...}]
            setSchedule(loaded);
        } catch (err) {
            console.error("Failed to load schedule", err);
        } finally {
            setLoading(false);
        }
    };

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
        // If exists, remove it? Or just toggle a 'active' flag?
        // Our DB stores only active blocks. So removing = disabled.
        setSchedule(prev => {
            const exists = prev.find(s => s.day_of_week === dayId);
            if (exists) {
                return prev.filter(s => s.day_of_week !== dayId);
            } else {
                return [...prev, {
                    day_of_week: dayId,
                    start_time: '08:00',
                    end_time: '20:00',
                    is_break: 0
                }];
            }
        });
    };

    const handleSave = async () => {
        try {
            await api.put(`/schedules/${doctorId}`, { schedule });
            if (onSave) onSave();
            alert("Horarios guardados correctamente.");
        } catch (err) {
            console.error(err);
            alert("Error al guardar horarios.");
        }
    };

    const [bulkStart, setBulkStart] = useState('08:00');
    const [bulkEnd, setBulkEnd] = useState('20:00');

    const applyBulk = (daysToApply) => {
        setSchedule(prev => {
            let newSched = [...prev];
            daysToApply.forEach(dayId => {
                const existingIndex = newSched.findIndex(s => s.day_of_week === dayId);
                const block = {
                    day_of_week: dayId,
                    start_time: bulkStart,
                    end_time: bulkEnd,
                    is_break: 0
                };
                if (existingIndex > -1) {
                    newSched[existingIndex] = block;
                } else {
                    newSched.push(block);
                }
            });
            return newSched;
        });
    };

    if (loading) return <div>Cargando horarios...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Configuración de Horarios de Atención</h3>
            <p className="text-sm text-slate-500 mb-6">Defina los días y franjas horarias en las que este médico atiende. El sistema utilizará esto para buscar turnos libres.</p>

            {/* Bulk Actions */}
            <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Aplicar a múltiples días</h4>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="time"
                            className="input-field py-1 px-2 w-28 text-sm"
                            value={bulkStart}
                            onChange={(e) => setBulkStart(e.target.value)}
                        />
                        <span className="text-slate-400">a</span>
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
                            <div className="w-32 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id={`day-${day.id}`}
                                    className="w-4 h-4 text-primary-600 rounded"
                                    checked={isActive}
                                    onChange={() => toggleDay(day.id)}
                                />
                                <label htmlFor={`day-${day.id}`} className={`font-medium cursor-pointer ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {day.name}
                                </label>
                            </div>

                            {isActive && (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="time"
                                        className="input-field py-1 px-2 w-28 text-sm"
                                        value={config.start_time ? config.start_time.slice(0, 5) : ''}
                                        onChange={(e) => handleDayChange(day.id, 'start_time', e.target.value)}
                                    />
                                    <span className="text-slate-400">a</span>
                                    <input
                                        type="time"
                                        className="input-field py-1 px-2 w-28 text-sm"
                                        value={config.end_time ? config.end_time.slice(0, 5) : ''}
                                        onChange={(e) => handleDayChange(day.id, 'end_time', e.target.value)}
                                    />
                                </div>
                            )}
                            {!isActive && <div className="text-xs text-slate-400 italic">No atiende</div>}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    className="btn btn-primary"
                >
                    Guardar Horarios
                </button>
            </div>
        </div>
    );
};

export default DoctorScheduleSettings;

import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { useMessage } from '../../context/MessageContext';
import Button from '../atoms/Button';

const DoctorScheduleSettings = ({ doctorId, schedule = [], setSchedule, loading }) => {
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { showMessage } = useMessage();
    const [updatingBulk, setUpdatingBulk] = useState(false);

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

    if (loading) return <div>Cargando horarios...</div>;

    return (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
            <h3 className="text-lg font-bold text-main-800 mb-4">Configuración de Horarios de Atención</h3>
            <p className="text-sm text-main-500 mb-6">Defina los días y franjas horarias en las que este médico atiende.</p>

            {/* Bulk Actions */}
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
                <h4 className="text-sm font-bold text-main-700 mb-3">Aplicar a múltiples días (Sobrescribe horarios)</h4>
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

            <div className="space-y-4">
                {DAYS.map(day => {
                    const dayBlocks = (Array.isArray(schedule) ? schedule : [])
                        .map((s, originalIndex) => ({ ...s, originalIndex })) // Track original index for editing
                        .filter(s => s.day_of_week === day.id)
                        .sort((a, b) => a.start_time.localeCompare(b.start_time));

                    const isActive = dayBlocks.length > 0;

                    return (
                        <div key={day.id} className={`p-4 rounded-lg border transition-all ${isActive ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                            <div className="flex items-start gap-4">
                                <div className="pt-2">
                                    <input
                                        type="checkbox"
                                        id={`day-${day.id}`}
                                        checked={isActive}
                                        onChange={() => toggleDay(day.id)}
                                        className="w-5 h-5 cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor={`day-${day.id}`} className={`text-lg font-bold mb-2 block cursor-pointer ${isActive ? 'text-main-800' : 'text-main-400'}`}>
                                        {day.name}
                                    </label>

                                    {isActive && (
                                        <div className="space-y-2">
                                            {dayBlocks.map((block, idx) => (
                                                <div key={idx} className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded border border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            className="input-field py-1 px-2 w-32 text-sm bg-white"
                                                            value={block.start_time ? block.start_time.slice(0, 5) : ''}
                                                            onChange={(e) => handleBlockChange(block.originalIndex, 'start_time', e.target.value)}
                                                        />
                                                        <span className="text-muted text-sm px-1">a</span>
                                                        <input
                                                            type="time"
                                                            className="input-field py-1 px-2 w-32 text-sm bg-white"
                                                            value={block.end_time ? block.end_time.slice(0, 5) : ''}
                                                            onChange={(e) => handleBlockChange(block.originalIndex, 'end_time', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>

                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            className={`input-field py-1 px-2 text-sm ${block.default_type === 'virtual' ? 'text-indigo-600 font-medium bg-indigo-50 border-indigo-200' : 'bg-white'}`}
                                                            value={block.default_type || 'consultation'}
                                                            onChange={(e) => {
                                                                handleBlockChange(block.originalIndex, 'default_type', e.target.value);
                                                                // Optional: Trigger confirmation for existing appts update if needed, similar to old logic
                                                            }}
                                                        >
                                                            <option value="consultation">🏥 Presencial</option>
                                                            <option value="virtual">📹 Videollamada</option>
                                                        </select>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm-compact"
                                                        onClick={() => handleRemoveBlock(block.originalIndex)}
                                                        className="ml-auto text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Eliminar franja"
                                                    >
                                                        🗑️
                                                    </Button>
                                                </div>
                                            ))}

                                            <Button
                                                variant="ghost"
                                                onClick={() => handleAddBlock(day.id)}
                                                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 w-fit"
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

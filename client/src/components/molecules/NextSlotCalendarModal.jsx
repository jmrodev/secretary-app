import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';

const NextSlotCalendarModal = ({
    isOpen,
    onClose,
    loading,
    nextSlotData,
    includeOutOfHours,
    onToggleOutOfHours,
    onSelect,
    onWhatsApp,
    onLoadMore,
    hasMore
}) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const todayIso = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).split(' ')[0];

    // Group slots by date
    const slotsByDate = useMemo(() => {
        const grouped = {};
        if (nextSlotData?.results) {
            console.log('📅 NextSlotData:', nextSlotData);
            nextSlotData.results.forEach(day => {
                const inHours = day.slots.filter(s => !s.is_out_of_hours).length;
                const outHours = day.slots.filter(s => s.is_out_of_hours).length;
                grouped[day.date] = {
                    total: day.slots.length,
                    inHours,
                    outHours,
                    slots: day.slots,
                    dayName: day.dayName
                };
            });
            console.log('📊 Slots grouped by date:', grouped);
        } else {
            console.log('⚠️ No nextSlotData or results');
        }
        return grouped;
    }, [nextSlotData]);

    // Get calendar days for current month view
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({
                day,
                dateStr,
                isToday: dateStr === todayIso,
                slots: slotsByDate[dateStr] || null
            });
        }

        return days;
    }, [currentMonth, slotsByDate, todayIso]);

    // Get selected date slots
    const selectedSlots = selectedDate ? slotsByDate[selectedDate]?.slots || [] : [];

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (dateStr) => {
        if (slotsByDate[dateStr]) {
            setSelectedDate(dateStr);
            setViewMode('list');
        }
    };

    // Auto-navigate to first month with data
    useEffect(() => {
        if (nextSlotData?.results && nextSlotData.results.length > 0 && isOpen) {
            const firstDate = nextSlotData.results[0].date;
            if (firstDate) {
                const [year, month] = firstDate.split('-');
                const firstDataMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
                setCurrentMonth(firstDataMonth);
                console.log('📍 Navegando al primer mes con datos:', firstDate);
            }
        }
    }, [nextSlotData, isOpen]);

    // Auto-load more data if viewing future months with no data
    useEffect(() => {
        if (!loading && hasMore && isOpen) {
            const lastDateInData = nextSlotData?.results?.[nextSlotData.results.length - 1]?.date;
            if (lastDateInData) {
                const lastDate = new Date(lastDateInData);
                const viewingMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

                // If viewing a month beyond our data, load more
                if (viewingMonth > lastDate) {
                    onLoadMore();
                }
            }
        }
    }, [currentMonth, loading, hasMore, nextSlotData, isOpen, onLoadMore]);

    // --- RENDER HELPERS ---

    const renderControls = () => (
        <div className="calendar-slot-controls">
            <label className="calendar-slot-controls__checkbox">
                <input
                    type="checkbox"
                    className="calendar-slot-controls__input"
                    checked={includeOutOfHours}
                    onChange={(e) => onToggleOutOfHours(e.target.checked)}
                />
                <span className="calendar-slot-controls__label">🔓 Incluir fuera de horario (08:00 - 21:00)</span>
            </label>

            <div className="calendar-slot-controls__toggle-group">
                <button
                    className={`calendar-slot-controls__toggle-btn ${viewMode === 'calendar' ? 'calendar-slot-controls__toggle-btn--active' : ''}`}
                    onClick={() => setViewMode('calendar')}
                >
                    📅 Calendario
                </button>
                <button
                    className={`calendar-slot-controls__toggle-btn ${viewMode === 'list' ? 'calendar-slot-controls__toggle-btn--active' : ''}`}
                    onClick={() => setViewMode('list')}
                >
                    📋 Lista
                </button>
            </div>
        </div>
    );

    const renderCalendarView = () => (
        <div className="calendar-grid">
            {/* Header */}
            <div className="calendar-grid__header">
                <button onClick={handlePrevMonth} className="calendar-grid__nav-btn" title="Mes anterior">⬅️</button>
                <h3 className="calendar-grid__title">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button onClick={handleNextMonth} className="calendar-grid__nav-btn" title="Mes siguiente">➡️</button>
            </div>

            {/* Days Header */}
            <div className="calendar-grid__days-row">
                {dayNames.map(day => (
                    <div key={day} className="calendar-grid__day-name">{day}</div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="calendar-grid__body">
                {calendarDays.map((dayData, idx) => {
                    if (!dayData) return <div key={`empty-${idx}`} className="calendar-grid__cell calendar-grid__cell--empty"></div>;

                    const { day, dateStr, isToday, slots } = dayData;
                    const isPast = dateStr < todayIso;
                    const hasSlots = slots && slots.total > 0;

                    let cellClasses = 'calendar-grid__cell';
                    if (isPast) cellClasses += ' calendar-grid__cell--past';
                    if (hasSlots) cellClasses += ' calendar-grid__cell--interactive';
                    if (isToday) cellClasses += ' calendar-grid__cell--today';

                    return (
                        <div
                            key={dateStr}
                            className={cellClasses}
                            onClick={() => hasSlots && handleDateClick(dateStr)}
                        >
                            <div className="flex flex-col items-center">
                                <span className="calendar-grid__date-number">{day}</span>
                                {isToday && <span className="calendar-grid__today-badge">HOY</span>}
                            </div>

                            {hasSlots && (
                                <div className="calendar-grid__indicators">
                                    {slots.inHours > 0 && (
                                        <div className="calendar-grid__badge calendar-grid__badge--normal">
                                            <span>✓</span><span>{slots.inHours}</span>
                                        </div>
                                    )}
                                    {slots.outHours > 0 && (
                                        <div className="calendar-grid__badge calendar-grid__badge--extra">
                                            <span>🔓</span><span>{slots.outHours}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Legend */}
            <div className="calendar-slot__legend" style={{ padding: '0.5rem' }}>
                <div className="calendar-slot__legend-item">
                    <div className="calendar-slot__legend-box calendar-slot__legend-box--in-hours"></div>
                    <span>Turnos en horario</span>
                </div>
                <div className="calendar-slot__legend-item">
                    <div className="calendar-slot__legend-box calendar-slot__legend-box--out-hours"></div>
                    <span>Turnos fuera de horario</span>
                </div>
            </div>
            {/* Load More Button inside Calendar View */}
            {hasMore && (
                <div className="flex justify-center p-2">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="btn btn-secondary btn-sm"
                    >
                        {loading ? 'Cargando...' : '🔍 Cargar más fechas'}
                    </button>
                </div>
            )}
        </div>
    );

    const renderListView = () => {
        if (!selectedDate || selectedSlots.length === 0) {
            return (
                <div className="calendar-empty">
                    <p className="font-bold text-lg">Selecciona una fecha del calendario para ver los horarios disponibles</p>
                    <button onClick={() => setViewMode('calendar')} className="btn btn-secondary mt-4">Ver Calendario</button>
                </div>
            );
        }

        const normalSlots = selectedSlots.filter(s => !s.is_out_of_hours);
        // Identify "Before" and "After" slots relative to normal hours
        let beforeSlots = [];
        let afterSlots = [];

        if (normalSlots.length > 0) {
            const firstNormalTime = normalSlots[0].iso;
            const lastNormalTime = normalSlots[normalSlots.length - 1].iso;
            beforeSlots = selectedSlots.filter(s => s.is_out_of_hours && s.iso < firstNormalTime);
            afterSlots = selectedSlots.filter(s => s.is_out_of_hours && s.iso > lastNormalTime);
        } else {
            // If no normal slots, treat all as generic "extra", put in 'before' for simplicity or a generic list
            beforeSlots = selectedSlots.filter(s => s.is_out_of_hours);
        }

        const renderSection = (title, slots, type) => {
            if (slots.length === 0) return null;
            const headerClass = type === 'normal' ? 'slots-list__section-header--normal' : 'slots-list__section-header--extra';

            return (
                <>
                    <div className={`slots-list__section-header ${headerClass}`}>{title}</div>
                    <table className="slots-list__table">
                        <tbody>
                            {slots.map((slot, idx) => (
                                <tr key={`${type}-${slot.iso}-${idx}`} className={type !== 'normal' ? 'slots-list__row--extra' : ''}>
                                    <td className="slots-list__row-cell">
                                        <div className="flex items-center gap-2">
                                            <span className={`slots-list__time ${type === 'normal' ? 'slots-list__time--normal' : 'slots-list__time--extra'}`}>
                                                {slot.time}
                                            </span>
                                            {type !== 'normal' && <span className="slots-list__tag-extra">EXTRA</span>}
                                        </div>
                                    </td>
                                    <td className="slots-list__row-cell text-right">
                                        <div className="slots-list__actions">
                                            <button
                                                className="btn-icon"
                                                onClick={(e) => { e.stopPropagation(); onWhatsApp(slot); }}
                                                title="WhatsApp"
                                                style={{ color: 'var(--green-600)', background: 'var(--green-50)' }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" /></svg>
                                            </button>
                                            <button
                                                className={`slots-list__action-btn ${type === 'normal' ? 'slots-list__action-btn--normal' : 'slots-list__action-btn--extra'}`}
                                                onClick={() => onSelect(slot.iso)}
                                            >
                                                {type === 'normal' ? 'Seleccionar' : 'Asignar Extra'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            );
        };

        return (
            <div className="slots-list">
                <div className="slots-list__header">
                    <h3 className="slots-list__title">
                        {slotsByDate[selectedDate]?.dayName}
                    </h3>
                    <button onClick={() => setViewMode('calendar')} className="slots-list__back-btn">
                        ← Volver al calendario
                    </button>
                </div>
                <div className="slots-list__content">
                    {renderSection('🔓 Antes del Horario (Extra)', beforeSlots, 'before')}
                    {renderSection('✅ Horario de Atención', normalSlots, 'normal')}
                    {renderSection('🔓 Después del Horario (Extra)', afterSlots, 'after')}
                </div>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="🔍 Búsqueda de Turnos Libres"
            size="lg"
        >
            <div className="calendar-slot-modal">
                {renderControls()}

                {loading && !nextSlotData ? (
                    <div className="calendar-loader">
                        <div className="loading-spinner-small"></div>
                        <p className="font-bold mt-3">Explorando agenda en busca de huecos...</p>
                    </div>
                ) : !nextSlotData || !nextSlotData.results || nextSlotData.results.length === 0 ? (
                    <div className="calendar-empty">
                        <p className="text-lg font-bold mb-2">No hay datos de turnos disponibles</p>
                        <p className="text-sm">Intenta activar "Incluir fuera de horario" o selecciona otro médico</p>
                    </div>
                ) : viewMode === 'calendar' ? (
                    renderCalendarView()
                ) : (
                    renderListView()
                )}

                <div className="calendar-footer">
                    <span>Haz clic en un día con turnos para ver los horarios</span>
                    <button className="btn btn-sm btn-ghost" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </Modal>
    );
};

export default NextSlotCalendarModal;

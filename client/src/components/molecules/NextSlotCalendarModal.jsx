import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import { useLanguage } from '../../context/LanguageContext';
import '../organisms/Calendar.css';
import '../molecules/CalendarHeader.css';
import '../molecules/DayHeaders.css';
import './NextSlotCalendarModal.css';

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
    const { t } = useLanguage();
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

    const monthNames = t('months_array') || ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = t('days_short_array') || ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const todayIso = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).split(' ')[0];

    // Group slots by date
    const slotsByDate = useMemo(() => {
        const grouped = {};
        if (nextSlotData?.results) {
            nextSlotData.results.forEach(day => {
                const inHours = day.slots.filter(s => !s.is_out_of_hours && !s.is_break).length;
                const outHours = day.slots.filter(s => s.is_out_of_hours).length;
                const breakSlotsCount = day.slots.filter(s => s.is_break).length;
                grouped[day.date] = {
                    total: day.slots.length,
                    inHours,
                    outHours,
                    breakSlotsCount,
                    slots: day.slots,
                    dayName: day.dayName
                };
            });
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

    // Auto-navigate to first month with data (only when modal first opens)
    useEffect(() => {
        if (nextSlotData?.results && nextSlotData.results.length > 0 && isOpen) {
            const firstDate = nextSlotData.results[0].date;
            if (firstDate) {
                const [year, month] = firstDate.split('-');
                const firstDataMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
                // Only set if we haven't set a month yet (initial load)
                setCurrentMonth(prev => {
                    // If we're already viewing a future month, don't reset
                    const prevTime = prev.getTime();
                    const firstDataTime = firstDataMonth.getTime();
                    // Only update if current month is before the first data month
                    if (prevTime < firstDataTime) {
                        return firstDataMonth;
                    }
                    return prev;
                });
            }
        }
    }, [isOpen]); // Only depend on isOpen, not nextSlotData

    // Auto-load more data if viewing future months with no data
    useEffect(() => {
        if (!loading && hasMore && isOpen) {
            const lastDateInData = nextSlotData?.results?.[nextSlotData.results.length - 1]?.date;
            if (lastDateInData) {
                const lastDate = new Date(lastDateInData);
                const viewingMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

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
                <span className="calendar-slot-controls__label">🔓 {t('include_overtime')}</span>
            </label>

            <div className="calendar-slot-controls__toggle-group">
                <button
                    className={`calendar-slot-controls__toggle-btn ${viewMode === 'calendar' ? 'calendar-slot-controls__toggle-btn--active' : ''}`}
                    onClick={() => setViewMode('calendar')}
                >
                    📅 {t('calendar')}
                </button>
                <button
                    className={`calendar-slot-controls__toggle-btn ${viewMode === 'list' ? 'calendar-slot-controls__toggle-btn--active' : ''}`}
                    onClick={() => setViewMode('list')}
                >
                    📋 {t('list')}
                </button>
            </div>
        </div>
    );

    const renderCalendarView = () => (
        <div className="calendar-grid">
            <div className="calendar-header">
                <button onClick={handlePrevMonth} className="calendar-header__nav-button" title={t('previous_month')}>⬅️</button>
                <h3 className="calendar-header__title">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button onClick={handleNextMonth} className="calendar-header__nav-button" title={t('next_month')}>➡️</button>
            </div>

            <div className="day-headers">
                {dayNames.map(day => (
                    <div key={day} className="day-headers__day">{day}</div>
                ))}
            </div>

            <div className="calendar-grid__body">
                {calendarDays.map((dayData, idx) => {
                    if (!dayData) return <div key={`empty-${idx}`} className="calendar-day-cell calendar-day-cell--other-month"></div>;

                    const { day, dateStr, isToday, slots } = dayData;
                    const isPast = dateStr < todayIso;
                    const hasSlots = slots && slots.total > 0;

                    let cellClasses = 'calendar-day-cell';
                    if (isPast) cellClasses += ' calendar-day-cell--disabled';
                    if (hasSlots) cellClasses += ' calendar-day-cell--interactive';
                    if (isToday) cellClasses += ' calendar-day-cell--today';

                    return (
                        <div
                            key={dateStr}
                            className={cellClasses}
                            onClick={() => hasSlots && handleDateClick(dateStr)}
                        >
                            <div className="calendar-day-cell__date">
                                <span className="calendar-day-cell__number">{day}</span>
                                {isToday && <span className="calendar-day-cell__today-marker">HOY</span>}
                            </div>

                            {hasSlots && (
                                <div className="calendar-slot__indicators">
                                    {slots.inHours > 0 && (
                                        <div className="calendar-slot__badge calendar-slot__badge--normal">
                                            {slots.inHours}
                                        </div>
                                    )}
                                    {slots.outHours > 0 && (
                                        <div className="calendar-slot__badge calendar-slot__badge--extra">
                                            {slots.outHours}
                                        </div>
                                    )}
                                    {slots.breakSlotsCount > 0 && (
                                        <div className="calendar-slot__badge calendar-slot__badge--break">
                                            {slots.breakSlotsCount}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="calendar-slot__legend">
                <div className="calendar-slot__legend-item">
                    <div className="calendar-slot__legend-box calendar-slot__legend-box--in-hours"></div>
                    <span>{t('appointments_in_hours')}</span>
                </div>
                <div className="calendar-slot__legend-item">
                    <div className="calendar-slot__legend-box calendar-slot__legend-box--out-hours"></div>
                    <span>{t('appointments_out_hours')}</span>
                </div>
                <div className="calendar-slot__legend-item">
                    <div className="calendar-slot__legend-box calendar-slot__legend-box--break"></div>
                    <span>{t('breaks_special_slots') || 'Ext. / Receso'}</span>
                </div>
            </div>

            {hasMore && (
                <div className="calendar-slot__load-more">
                    <Button
                        onClick={onLoadMore}
                        disabled={loading}
                        variant="ghost"
                        size="sm"
                    >
                        {loading ? t('loading') : `🔍 ${t('load_more_dates')}`}
                    </Button>
                </div>
            )}
        </div>
    );

    const renderListView = () => {
        if (!selectedDate || selectedSlots.length === 0) {
            return (
                <div className="calendar-empty">
                    <p className="font-bold text-lg">{t('select_date_to_view')}</p>
                    <Button onClick={() => setViewMode('calendar')} variant="secondary" className="mt-4">{t('view_calendar')}</Button>
                </div>
            );
        }

        const normalSlots = selectedSlots.filter(s => !s.is_out_of_hours && !s.is_break);
        const breakSlots = selectedSlots.filter(s => s.is_break);
        let beforeSlots = [];
        let afterSlots = [];

        if (normalSlots.length > 0) {
            const firstNormalTime = normalSlots[0].iso;
            const lastNormalTime = normalSlots[normalSlots.length - 1].iso;
            beforeSlots = selectedSlots.filter(s => s.is_out_of_hours && s.iso < firstNormalTime);
            afterSlots = selectedSlots.filter(s => s.is_out_of_hours && s.iso > lastNormalTime);
        } else {
            beforeSlots = selectedSlots.filter(s => s.is_out_of_hours);
        }

        const renderSection = (title, slots, type) => {
            if (slots.length === 0) return null;
            const headerClass = type === 'normal' ? 'slots-list__section-header--normal' : 'slots-list__section-header--extra';

            return (
                <div className="slots-list__section">
                    <div className={`slots-list__section-header ${headerClass}`}>{title}</div>
                    <table className="slots-list__table">
                        <tbody>
                            {slots.map((slot, idx) => (
                                <tr key={`${type}-${slot.iso}-${idx}`} className={`slots-list__row ${type !== 'normal' ? 'slots-list__row--extra' : ''}`}>
                                    <td className="slots-list__cell">
                                        <div className="slots-list__time-group">
                                            <span className={`slots-list__time slots-list__time--${type}`}>
                                                {slot.time}
                                            </span>
                                            {type === 'before' && <span className="slots-list__tag-extra">EXTRA</span>}
                                            {type === 'after' && <span className="slots-list__tag-extra">EXTRA</span>}
                                            {type === 'break' && <span className="slots-list__tag-break">EXT</span>}
                                        </div>
                                    </td>
                                    <td className="slots-list__cell slots-list__cell--actions">
                                        <div className="slots-list__actions">
                                            <button
                                                className="slots-list__wa-btn"
                                                onClick={(e) => { e.stopPropagation(); onWhatsApp(slot); }}
                                                title="WhatsApp"
                                            >
                                                📲
                                            </button>
                                            <Button
                                                variant={type === 'normal' ? 'primary' : 'secondary'}
                                                size="sm-compact"
                                                onClick={() => onSelect(slot.iso, slot.is_out_of_hours)}
                                            >
                                                {type === 'normal' ? t('select') : (type === 'break' ? t('assign_ext') : t('assign_extra'))}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        };

        return (
            <div className="slots-list">
                <div className="slots-list__header">
                    <h3 className="slots-list__title">
                        {slotsByDate[selectedDate]?.dayName} - {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}
                    </h3>
                    <button onClick={() => setViewMode('calendar')} className="slots-list__back-btn">
                        ← {t('back_to_calendar')}
                    </button>
                </div>
                <div className="slots-list__body">
                    {renderSection(`🔓 ${t('before_hours_extra')}`, beforeSlots, 'before')}
                    {renderSection(`✅ ${t('attention_hours')}`, normalSlots, 'normal')}
                    {renderSection(`☕ ${t('breaks_special_slots')}`, breakSlots, 'break')}
                    {renderSection(`🔓 ${t('after_hours_extra')}`, afterSlots, 'after')}
                </div>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`🔍 ${t('search_free_slots')}`}
            size="lg"
        >
            <div className="calendar-slot-modal">
                {renderControls()}

                <div className="calendar-slot-modal__content">
                    {loading && !nextSlotData ? (
                        <div className="calendar-loader">
                            <div className="loading-spinner"></div>
                            <p className="calendar-loader__text">{t('exploring_schedule')}</p>
                        </div>
                    ) : !nextSlotData || !nextSlotData.results || nextSlotData.results.length === 0 ? (
                        <div className="calendar-empty">
                            <p className="calendar-empty__text">{t('no_slots_available')}</p>
                            <p className="calendar-empty__subtext">{t('try_out_of_hours')}</p>
                        </div>
                    ) : viewMode === 'calendar' ? (
                        renderCalendarView()
                    ) : (
                        renderListView()
                    )}
                </div>

                <div className="calendar-slot-modal__footer">
                    <span className="calendar-slot-modal__hint">{t('click_day_to_view')}</span>
                    <Button variant="secondary" outline size="sm" onClick={onClose}>{t('close')}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default NextSlotCalendarModal;

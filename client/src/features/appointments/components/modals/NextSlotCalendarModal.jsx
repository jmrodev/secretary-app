import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import './NextSlotCalendarModal.css';

/**
 * NextSlotCalendarModal (Executor Component).
 * Advanced search UI for free slots using a monthly calendar grid or a list view.
 */
const NextSlotCalendarModal = ({
    isOpen, onClose, loading, nextSlotData, includeOutOfHours, onToggleOutOfHours,
    onSelect, onWhatsApp, onLoadMore, hasMore
}) => {
    const { t } = useLanguage();
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState('calendar');
    const [hasInitialized, setHasInitialized] = useState(false);

    const monthNames = t('months_array') || [];
    const dayNames = t('days_short_array') || [];
    const todayIso = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).split(' ')[0];

    const slotsByDate = useMemo(() => {
        const grouped = {};
        if (nextSlotData?.results) {
            nextSlotData.results.forEach(day => {
                grouped[day.date] = {
                    total: day.slots.length,
                    inHours: day.slots.filter(s => !s.is_out_of_hours && !s.is_break).length,
                    outHours: day.slots.filter(s => s.is_out_of_hours).length,
                    breakSlotsCount: day.slots.filter(s => s.is_break).length,
                    slots: day.slots, dayName: day.dayName
                };
            });
        }
        return grouped;
    }, [nextSlotData]);

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({ day, dateStr, isToday: dateStr === todayIso, slots: slotsByDate[dateStr] || null });
        }
        return days;
    }, [currentMonth, slotsByDate, todayIso]);

    const selectedSlots = selectedDate ? slotsByDate[selectedDate]?.slots || [] : [];
    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const handleDateClick = (dateStr) => {
        if (slotsByDate[dateStr]) { setSelectedDate(dateStr); setViewMode('list'); }
    };

    useEffect(() => {
        if (!isOpen) queueMicrotask(() => setHasInitialized(false));
    }, [isOpen]);

    useEffect(() => {
        let isMounted = true;
        if (nextSlotData?.results?.length > 0 && isOpen && !hasInitialized) {
            if (isMounted) {
                const [year, month] = nextSlotData.results[0].date.split('-');
                queueMicrotask(() => {
                    setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                    setHasInitialized(true);
                });
            }
        }
        return () => { isMounted = false; };
    }, [nextSlotData, isOpen, hasInitialized]);

    useEffect(() => {
        if (!loading && hasMore && isOpen) {
            const lastDate = nextSlotData?.results?.[nextSlotData.results.length - 1]?.date;
            if (lastDate && new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0) > new Date(lastDate)) onLoadMore();
        }
    }, [currentMonth, loading, hasMore, nextSlotData, isOpen, onLoadMore]);

    const renderControls = () => (
        <div className="calendar-slot-controls">
            <label className="calendar-slot-controls__checkbox">
                <input type="checkbox" className="calendar-slot-controls__input" checked={includeOutOfHours} onChange={(e) => onToggleOutOfHours(e.target.checked)} />
                <span className="calendar-slot-controls__label">
                    <Icon name="lock_open" size="1rem" />
                    {t('include_overtime')}
                </span>
            </label>
            <div className="calendar-slot-controls__toggle-group">
                <Button 
                    variant="ghost"
                    className={`calendar-slot-controls__toggle-btn ${viewMode === 'calendar' ? 'calendar-slot-controls__toggle-btn--active' : ''}`} 
                    onClick={() => setViewMode('calendar')}
                    icon={<Icon name="calendar_today" size="1rem" />}
                >
                    {t('calendar')}
                </Button>
                <Button 
                    variant="ghost"
                    className={`calendar-slot-controls__toggle-btn ${viewMode === 'list' ? 'calendar-slot-controls__toggle-btn--active' : ''}`} 
                    onClick={() => {
                        if (!selectedDate && nextSlotData?.results?.length > 0) {
                            setSelectedDate(nextSlotData.results[0].date);
                        }
                        setViewMode('list');
                    }}
                    icon={<Icon name="list" size="1rem" />}
                >
                    {t('list')}
                </Button>
            </div>
        </div>
    );

    const renderSection = (title, slots, type) => {
        if (slots.length === 0) return null;
        return (
            <div className="slots-list__section">
                <div className={`slots-list__section-header ${type === 'normal' ? 'slots-list__section-header--normal' : 'slots-list__section-header--extra'}`}>{title}</div>
                <table className="slots-list__table">
                    <tbody>{slots.map((slot, idx) => (
                        <tr key={`${type}-${slot.iso}-${idx}`} className={`slots-list__row ${type !== 'normal' ? 'slots-list__row--extra' : ''}`}>
                            <td className="slots-list__cell">
                                <div className="slots-list__time-group">
                                    <span className={`slots-list__time slots-list__time--${type}`}>{slot.time}</span>
                                    {(type === 'before' || type === 'after') && <span className="slots-list__tag-extra">EXTRA</span>}
                                    {type === 'break' && <span className="slots-list__tag-break">EXT</span>}
                                </div>
                            </td>
                            <td className="slots-list__cell slots-list__cell--actions">
                                <div className="slots-list__actions">
                                    <Button className="slots-list__wa-btn" onClick={(e) => { e.stopPropagation(); onWhatsApp(slot); }} title="WhatsApp" unstyled><Icon name="chat" size="1.1rem" /></Button>
                                    <Button variant={type === 'normal' ? 'primary' : 'secondary'} size="sm-compact" onClick={() => onSelect(slot.iso, slot.is_out_of_hours)}>
                                        {type === 'normal' ? t('select') : (type === 'break' ? t('assign_ext') : t('assign_extra'))}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        );
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={(
                <div className="calendar-slot-modal__title-group">
                    <Icon name="search" size="1.2rem" />
                    {t('search_free_slots')}
                </div>
            )} 
            size="lg" 
            className="calendar-slot-modal-container"
        >
            <div className="calendar-slot-modal">
                {renderControls()}
                <div className="calendar-slot-modal__content">
                    {loading && !nextSlotData ? (
                        <div className="calendar-loader">
                            <div className="loading-spinner"></div>
                            <p className="calendar-loader__text">{t('exploring_schedule')}</p>
                        </div>
                    ) : !nextSlotData || nextSlotData.results?.length === 0 ? (
                        <div className="calendar-empty">
                            <p className="calendar-empty__text">{t('no_slots_available')}</p>
                        </div>
                    ) : viewMode === 'calendar' ? (
                        <div className="calendar-grid">
                            <div className="calendar-header">
                                <Button onClick={handlePrevMonth} variant="ghost" size="sm-compact" icon={<Icon name="chevron_left" />} />
                                <h3 className="calendar-header__title">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                                <Button onClick={handleNextMonth} variant="ghost" size="sm-compact" icon={<Icon name="chevron_right" />} />
                            </div>
                            <div className="day-headers">
                                {dayNames.map(day => <div key={day} className="day-headers__day">{day}</div>)}
                            </div>
                            <div className="calendar-grid__body">
                                {calendarDays.map((dayData, idx) => {
                                    if (!dayData) return <div key={`empty-${idx}`} className="calendar-day-cell calendar-day-cell--other-month"></div>;
                                    const { day, dateStr, isToday, slots } = dayData;
                                    const hasSlots = slots && slots.total > 0;
                                    return (
                                        <div 
                                            key={dateStr} 
                                            className={`calendar-day-cell ${dateStr < todayIso ? 'calendar-day-cell--disabled' : ''} ${hasSlots ? 'calendar-day-cell--interactive' : ''} ${isToday ? 'calendar-day-cell--today' : ''}`} 
                                            onClick={() => hasSlots && handleDateClick(dateStr)}
                                        >
                                            <div className="calendar-day-cell__date">
                                                <span className="calendar-day-cell__number">{day}</span>
                                                {isToday && <span className="calendar-day-cell__today-marker">HOY</span>}
                                            </div>
                                            {hasSlots && (
                                                <div className="calendar-slot__indicators">
                                                    {slots.inHours > 0 && <div className="calendar-slot__badge calendar-slot__badge--normal">{slots.inHours}</div>}
                                                    {slots.outHours > 0 && <div className="calendar-slot__badge calendar-slot__badge--extra">{slots.outHours}</div>}
                                                    {slots.breakSlotsCount > 0 && <div className="calendar-slot__badge calendar-slot__badge--break">{slots.breakSlotsCount}</div>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="slots-list">
                            <div className="slots-list__header">
                                <h3 className="slots-list__title">
                                    {slotsByDate[selectedDate]?.dayName || t('search_free_slots')} 
                                    {selectedDate ? ` - ${new Date(selectedDate + 'T12:00:00').toLocaleDateString()}` : ''}
                                </h3>
                                <Button 
                                    onClick={() => setViewMode('calendar')} 
                                    variant="ghost" 
                                    size="sm-compact" 
                                    icon={<Icon name="arrow_back" />}
                                >
                                    {t('back_to_calendar')}
                                </Button>
                            </div>
                            <div className="slots-list__body">
                                {renderSection(
                                    <><Icon name="lock_open" /> {t('before_hours_extra')}</>, 
                                    selectedSlots.filter(s => s.is_out_of_hours && s.iso < (selectedSlots.find(n => !n.is_out_of_hours && !n.is_break)?.iso || '99:99')), 
                                    'before'
                                )}
                                {renderSection(
                                    <><Icon name="check_circle" /> {t('attention_hours')}</>, 
                                    selectedSlots.filter(s => !s.is_out_of_hours && !s.is_break), 
                                    'normal'
                                )}
                                {renderSection(
                                    <><Icon name="coffee" /> {t('breaks_special_slots')}</>, 
                                    selectedSlots.filter(s => s.is_break), 
                                    'break'
                                )}
                                {renderSection(
                                    <><Icon name="lock_open" /> {t('after_hours_extra')}</>, 
                                    selectedSlots.filter(s => s.is_out_of_hours && s.iso > (selectedSlots.filter(n => !n.is_out_of_hours && !n.is_break).pop()?.iso || '00:00')), 
                                    'after'
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="calendar-slot-modal__footer">
                    <Button variant="secondary" outline size="sm" onClick={onClose}>
                        {t('close')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default NextSlotCalendarModal;

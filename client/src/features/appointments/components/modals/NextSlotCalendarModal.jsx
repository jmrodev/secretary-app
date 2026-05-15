import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import Loading from '@/components/atoms/Loading';
import { formatDate, toInputDate, getNow, createDate, parseDate } from '@/utils/core/dateUtils';
import './NextSlotCalendarModal.css';

/**
 * NextSlotCalendarModal (Executor Component).
 * Advanced search UI for free slots using a monthly calendar grid or a list view.
 */
const SlotControls = ({ includeOutOfHours, onToggleOutOfHours, viewMode, setViewMode, selectedDate, nextSlotData, t }) => (
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
                        // handled by parent
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

const SlotSection = ({ title, slots, type, onWhatsApp, onSelect, t }) => {
    if (slots.length === 0) return null;
    return (
        <div className="slots-list__section">
            <div className={`slots-list__section-header ${type === 'normal' ? 'slots-list__section-header--normal' : 'slots-list__section-header--extra'}`}>{title}</div>
            <table className="slots-list__table">
                <tbody>{slots.map((slot) => (
                    <tr key={`${type}-${slot.iso}`} className={`slots-list__row ${type !== 'normal' ? 'slots-list__row--extra' : ''}`}>
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

const modalInitialState = {
    selectedDate: null,
    currentMonth: getNow(),
    viewMode: 'calendar',
    hasInitialized: false,
    clientDates: { todayIso: '', selectedDateStr: '' }
};

function modalReducer(state, action) {
    switch (action.type) {
        case 'SET_DATE': return { ...state, selectedDate: action.payload };
        case 'SET_MONTH': return { ...state, currentMonth: action.payload };
        case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload };
        case 'SET_INITIALIZED': return { ...state, hasInitialized: action.payload };
        case 'SET_CLIENT_DATES': return { ...state, clientDates: { ...state.clientDates, ...action.payload } };
        case 'RESET': return { ...modalInitialState, currentMonth: getNow() };
        default: return state;
    }
}

const NextSlotCalendarModal = ({
    isOpen, onClose, loading, nextSlotData, includeOutOfHours, onToggleOutOfHours,
    onSelect, onWhatsApp, onLoadMore, hasMore
}) => {
    const { t } = useLanguage();
    const [state, dispatch] = React.useReducer(modalReducer, modalInitialState);
    const { selectedDate, currentMonth, viewMode, hasInitialized, clientDates } = state;

    const monthNames = t('months_array') || [];
    const dayNames = t('days_short_array') || [];

    useEffect(() => {
        dispatch({ type: 'SET_CLIENT_DATES', payload: { todayIso: toInputDate(getNow()) } });
    }, []);

    useEffect(() => {
        if (selectedDate) {
            dispatch({ type: 'SET_CLIENT_DATES', payload: { selectedDateStr: formatDate(selectedDate + 'T12:00:00') } });
        }
    }, [selectedDate]);

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
        const firstDay = createDate(year, month, 1).getDay();
        const lastDay = createDate(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({ day, dateStr, isToday: dateStr === clientDates.todayIso, slots: slotsByDate[dateStr] || null });
        }
        return days;
    }, [currentMonth, slotsByDate, clientDates.todayIso]);

    const selectedSlots = selectedDate ? slotsByDate[selectedDate]?.slots || [] : [];
    const handlePrevMonth = () => dispatch({ type: 'SET_MONTH', payload: createDate(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1) });
    const handleNextMonth = () => dispatch({ type: 'SET_MONTH', payload: createDate(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) });

    const handleDateClick = (dateStr) => {
        if (slotsByDate[dateStr]) { 
            dispatch({ type: 'SET_DATE', payload: dateStr }); 
            dispatch({ type: 'SET_VIEW_MODE', payload: 'list' }); 
        }
    };

    const handleKeyDown = (e, dateStr, hasSlots) => {
        if ((e.key === 'Enter' || e.key === ' ') && hasSlots) {
            e.preventDefault();
            handleDateClick(dateStr);
        }
    };

    useEffect(() => {
        if (!isOpen) queueMicrotask(() => dispatch({ type: 'SET_INITIALIZED', payload: false }));
    }, [isOpen]);

    useEffect(() => {
        let isMounted = true;
        if (nextSlotData?.results?.length > 0 && isOpen && !hasInitialized) {
            if (isMounted) {
                const [year, month] = nextSlotData.results[0].date.split('-');
                queueMicrotask(() => {
                    dispatch({ type: 'SET_MONTH', payload: createDate(parseInt(year), parseInt(month) - 1, 1) });
                    dispatch({ type: 'SET_INITIALIZED', payload: true });
                });
            }
        }
        return () => { isMounted = false; };
    }, [nextSlotData, isOpen, hasInitialized]);

    const onLoadMoreRef = React.useRef(onLoadMore);
    useEffect(() => {
        onLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    useEffect(() => {
        if (!loading && hasMore && isOpen) {
            const lastDate = nextSlotData?.results?.[nextSlotData.results.length - 1]?.date;
            if (lastDate && createDate(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0) > parseDate(lastDate)) {
                onLoadMoreRef.current();
            }
        }
    }, [currentMonth, loading, hasMore, nextSlotData, isOpen]);

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
                <SlotControls 
                    includeOutOfHours={includeOutOfHours}
                    onToggleOutOfHours={onToggleOutOfHours}
                    viewMode={viewMode}
                    setViewMode={(mode) => {
                        if (mode === 'list' && !selectedDate && nextSlotData?.results?.length > 0) {
                            dispatch({ type: 'SET_DATE', payload: nextSlotData.results[0].date });
                        }
                        dispatch({ type: 'SET_VIEW_MODE', payload: mode });
                    }}
                    selectedDate={selectedDate}
                    nextSlotData={nextSlotData}
                    t={t}
                />
                <div className="calendar-slot-modal__content">
                    {loading && !nextSlotData ? (
                        <Loading text={t('exploring_schedule')} />
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
                                {dayNames.map((day, idx) => <div key={`header-${idx}`} className="day-headers__day">{day}</div>)}
                            </div>
                            <div className="calendar-grid__body">
                                {calendarDays.map((dayData, idx) => {
                                    if (!dayData) return <div key={`empty-${currentMonth.getTime()}-${idx}`} className="calendar-day-cell calendar-day-cell--other-month"></div>;
                                    const { day, dateStr, isToday, slots } = dayData;
                                    const hasSlots = slots && slots.total > 0;
                                    const isDisabled = dateStr < clientDates.todayIso;
                                    return (
                                        <div 
                                            key={dateStr} 
                                            role="button"
                                            tabIndex={hasSlots ? 0 : -1}
                                            aria-label={`${day} ${monthNames[currentMonth.getMonth()]}`}
                                            className={`calendar-day-cell ${isDisabled ? 'calendar-day-cell--disabled' : ''} ${hasSlots ? 'calendar-day-cell--interactive' : ''} ${isToday ? 'calendar-day-cell--today' : ''}`} 
                                            onClick={() => hasSlots && handleDateClick(dateStr)}
                                            onKeyDown={(e) => handleKeyDown(e, dateStr, hasSlots)}
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
                                    {selectedDate && clientDates.selectedDateStr ? ` - ${clientDates.selectedDateStr}` : ''}
                                </h3>
                                <Button 
                                    onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'calendar' })} 
                                    variant="ghost" 
                                    size="sm-compact" 
                                    icon={<Icon name="arrow_back" />}
                                >
                                    {t('back_to_calendar')}
                                </Button>
                            </div>
                            <div className="slots-list__body">
                                <SlotSection 
                                    title={<><Icon name="lock_open" /> {t('before_hours_extra')}</>}
                                    slots={selectedSlots.filter(s => s.is_out_of_hours && s.iso < (selectedSlots.find(n => !n.is_out_of_hours && !n.is_break)?.iso || '99:99'))}
                                    type="before"
                                    onWhatsApp={onWhatsApp}
                                    onSelect={onSelect}
                                    t={t}
                                />
                                <SlotSection 
                                    title={<><Icon name="check_circle" /> {t('attention_hours')}</>}
                                    slots={selectedSlots.filter(s => !s.is_out_of_hours && !s.is_break)}
                                    type="normal"
                                    onWhatsApp={onWhatsApp}
                                    onSelect={onSelect}
                                    t={t}
                                />
                                <SlotSection 
                                    title={<><Icon name="coffee" /> {t('breaks_special_slots')}</>}
                                    slots={selectedSlots.filter(s => s.is_break)}
                                    type="break"
                                    onWhatsApp={onWhatsApp}
                                    onSelect={onSelect}
                                    t={t}
                                />
                                <SlotSection 
                                    title={<><Icon name="lock_open" /> {t('after_hours_extra')}</>}
                                    slots={selectedSlots.filter(s => s.is_out_of_hours && s.iso > (selectedSlots.filter(n => !n.is_out_of_hours && !n.is_break).pop()?.iso || '00:00'))}
                                    type="after"
                                    onWhatsApp={onWhatsApp}
                                    onSelect={onSelect}
                                    t={t}
                                />
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

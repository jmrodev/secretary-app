import React, { useEffect, useMemo, useRef } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { Loading } from '@/components/atoms/Loading';
import { formatDate, toInputDate, getNow } from '@/utils/core/dateUtils';
import styles from './NextSlotCalendarModal.module.css';

/**
 * NextSlotCalendarModal (Executor Component).
 * Two-step slot finder:
 *  Step 1 — "days": scrollable list of available days with free-slot count chip.
 *  Step 2 — "slots": time slots for the chosen day.
 *
 * Chip logic:
 *  - includeOutOfHours OFF → chip shows only in-hours count; days with 0 in-hours are hidden.
 *  - includeOutOfHours ON  → chip shows total count; out-of-hours-only days appear with amber chip.
 */

import { SlotSection } from '../sections/NextSlotSection';
import { DayListItem } from '../sections/NextSlotDayItem';

/* ─── Main Component ──────────────────────────────────────────────────────── */
export const NextSlotCalendarModal = ({
    isOpen, onClose, loading, nextSlotData, includeOutOfHours, onToggleOutOfHours,
    onSelect, onWhatsApp, onLoadMore, hasMore
}) => {
    const { t } = useLanguage();
    const [step, setStep] = React.useState('days');          // 'days' | 'slots'
    const [selectedDate, setSelectedDate] = React.useState(null);
    const listBottomRef = useRef(null);
    const onLoadMoreRef = useRef(onLoadMore);
    const todayIso = toInputDate(getNow());

    useEffect(() => {
        if (!isOpen) {
            setStep('days');
            setSelectedDate(null);
        }
    }, [isOpen]);

    useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

    /* Build structured day rows from backend results */
    const dayRows = useMemo(() => {
        if (!nextSlotData?.results) return [];
        return nextSlotData.results.flatMap(day => {
            const inCount  = day.slots.filter(s => !s.is_out_of_hours && !s.is_break).length;
            const outCount = day.slots.filter(s => s.is_out_of_hours || s.is_break).length;
            // When out-of-hours is OFF, hide days with 0 in-hours slots
            if (!includeOutOfHours && inCount === 0) return [];
            return [{
                date: day.date,
                dayName: day.dayName,
                slots: day.slots,
                inCount,
                outCount,
            }];
        });
    }, [nextSlotData, includeOutOfHours]);

    /* Slots for selected day */
    const selectedSlots = useMemo(() => {
        if (!selectedDate || !nextSlotData?.results) return [];
        return nextSlotData.results.find(d => d.date === selectedDate)?.slots || [];
    }, [selectedDate, nextSlotData]);

    const selectedDayRow = dayRows.find(d => d.date === selectedDate);

    /* Auto-load more when reaching the bottom of the list */
    useEffect(() => {
        if (!listBottomRef.current || !hasMore || loading) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) onLoadMoreRef.current?.(); },
            { threshold: 0.1 }
        );
        const el = listBottomRef.current;
        observer.observe(el);
        return () => observer.unobserve(el);
    }, [hasMore, loading, dayRows]);

    /* ── Handlers ── */
    const handleDayClick = (dateStr) => {
        setSelectedDate(dateStr);
        setStep('slots');
    };

    const handleBack = () => setStep('days');

    /* ── Slot sections ── */
    const firstNormal = selectedSlots.find(s => !s.is_out_of_hours && !s.is_break);
    const lastNormal  = [...selectedSlots].filter(s => !s.is_out_of_hours && !s.is_break).pop();
    const beforeSlots = selectedSlots.filter(s => s.is_out_of_hours && s.iso < (firstNormal?.iso || '99:99'));
    const normalSlots = selectedSlots.filter(s => !s.is_out_of_hours && !s.is_break);
    const breakSlots  = selectedSlots.filter(s => s.is_break);
    const afterSlots  = selectedSlots.filter(s => s.is_out_of_hours && s.iso > (lastNormal?.iso  || '00:00'));

    const selectedDateLabel = selectedDate
        ? formatDate(selectedDate + 'T12:00:00', { weekday: true, monthName: true })
        : '';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={(
                <div className={`${styles.NextSlotCalendarModal__titleGroup}`}>
                    <Icon name="search" size="1.2rem" />
                    {t('search_free_slots')}
                </div>
            )}
            size="md"
            className={`${styles.NextSlotCalendarModal__calendarSlotModalContainer}`}
        >
            <div className={`${styles.NextSlotCalendarModal__calendarSlotModal}`}>

                {/* ── Controls bar ── */}
                <div className={`${styles.NextSlotCalendarModal__calendarSlotControls}`}>
                    <label className={`${styles.NextSlotCalendarModal__checkbox}`}>
                        <input
                            type="checkbox"
                            className={`${styles.NextSlotCalendarModal__input}`}
                            checked={includeOutOfHours}
                            onChange={(e) => onToggleOutOfHours(e.target.checked)}
                        />
                        <span className={`${styles.NextSlotCalendarModal__label}`}>
                            <Icon name="lock_open" size="1rem" />
                            {t('include_overtime')}
                        </span>
                    </label>
                </div>

                {/* ── Content ── */}
                <div className={`${styles.NextSlotCalendarModal__content}`}>
                    {loading && !nextSlotData ? (
                        <Loading text={t('exploring_schedule')} />
                    ) : !dayRows.length ? (
                        <div className={`${styles.NextSlotCalendarModal__calendarEmpty}`}>
                            <Icon name="event_busy" size="2.5rem" className={`${styles.NextSlotCalendarModal__icon}`} />
                            <p className={`${styles.NextSlotCalendarModal__text}`}>
                                {includeOutOfHours ? t('no_slots_available') : t('no_slots_try_overtime')}
                            </p>
                        </div>
                    ) : step === 'days' ? (

                        /* ── Step 1: Day list ── */
                        <div className={`${styles.NextSlotCalendarModal__dayList}`}>
                            {dayRows.map(row => (
                                <DayListItem
                                    key={row.date}
                                    dateStr={row.date}
                                    dayName={row.dayName}
                                    dateLabel={formatDate(row.date + 'T12:00:00', { monthName: true })}
                                    isToday={row.date === todayIso}
                                    inCount={row.inCount}
                                    outCount={row.outCount}
                                    includeOutOfHours={includeOutOfHours}
                                    onClick={() => handleDayClick(row.date)}
                                />
                            ))}
                            {/* Sentinel for infinite scroll */}
                            <div ref={listBottomRef} className={`${styles.NextSlotCalendarModal__sentinel}`}>
                                {loading && <Loading text={t('loading')} />}
                            </div>
                        </div>

                    ) : (

                        /* ── Step 2: Slots for selected day ── */
                        <div className={`${styles.NextSlotCalendarModal__root}`}>
                            <div className={`${styles.NextSlotCalendarModal__header}`}>
                                <h3 className={`${styles.NextSlotCalendarModal__title}`}>
                                    {selectedDayRow?.dayName || ''}
                                    {selectedDateLabel ? <span className={`${styles.NextSlotCalendarModal__titleDate}`}> — {selectedDateLabel}</span> : ''}
                                </h3>
                                <Button
                                    onClick={handleBack}
                                    variant="ghost"
                                    size="sm-compact"
                                    icon={<Icon name="arrow_back" />}
                                >
                                    {t('back')}
                                </Button>
                            </div>
                            <div className={`${styles.NextSlotCalendarModal__body}`}>
                                <SlotSection
                                    title={<><Icon name="lock_open" /> {t('before_hours_extra')}</>}
                                    slots={beforeSlots}
                                    type="before"
                                    onWhatsApp={onWhatsApp}
                                    onSelect={onSelect}
                                    t={t}
                                />
                                <SlotSection
                                    title={<><Icon name="check_circle" /> {t('attention_hours')}</>}
                                    slots={normalSlots}
                                    type="normal"
                                    onWhatsApp={onWhatsApp}
                                    onSelect={onSelect}
                                    t={t}
                                />
                                <SlotSection
                                    title={<><Icon name="coffee" /> {t('breaks_special_slots')}</>}
                                    slots={breakSlots}
                                    type="break"
                                    onWhatsApp={onWhatsApp}
                                    onSelect={onSelect}
                                    t={t}
                                />
                                <SlotSection
                                    title={<><Icon name="lock_open" /> {t('after_hours_extra')}</>}
                                    slots={afterSlots}
                                    type="after"
                                    onWhatsApp={onWhatsApp}
                                    onSelect={onSelect}
                                    t={t}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className={`${styles.NextSlotCalendarModal__footer}`}>
                    {step === 'slots' && (
                        <Button variant="ghost" size="sm" onClick={handleBack} icon={<Icon name="arrow_back" />}>
                            {t('back')}
                        </Button>
                    )}
                    <Button variant="secondary" outline size="sm" onClick={onClose}>
                        {t('close')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};


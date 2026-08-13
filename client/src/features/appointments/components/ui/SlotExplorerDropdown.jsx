import React, { useMemo, useState, useRef, useEffect } from 'react';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import { useLanguage } from '@/hooks/useLanguage';
import { getNow } from '@/utils/core/dateUtils';
import styles from './SlotExplorerDropdown.module.css';

/**
 * SlotExplorerDropdown (Minimal ECC Version).
 * Integrated, high-efficiency explorer.
 */
const SlotExplorerDropdown = ({
    isOpen, onClose, loading, nextSlotData, includeOutOfHours, onToggleOutOfHours,
    slotsPage, setSlotsPage, slotPages, onSelect, onWhatsApp, jumpToMonth,
    fetchNextFreeSlots, hasNextGroup
}) => {
    const { t } = useLanguage();
    const listRef = useRef(null);
    const [activeDay, setActiveDay] = useState(null);
    
    // ECC: Use Spanish names in lowercase as requested
    const monthNames = useMemo(() => {
        const translated = t('months_short_array');
        return Array.isArray(translated) ? translated : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    }, [t]);

    const navMonths = useMemo(() => {
        const now = getNow();
        return Array.from({ length: 8 }).map((_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            return { 
                label: monthNames[d.getMonth()], 
                month: d.getMonth(), 
                year: d.getFullYear() 
            };
        });
    }, [monthNames]);

    const currentSlots = useMemo(() => slotPages.flat(), [slotPages]);
    
    const uniqueDays = useMemo(() => {
        const days = [];
        currentSlots.forEach(slot => {
            if (!days.find(d => d.date === slot.dayDate)) {
                const dateObj = new Date(slot.dayDate + 'T12:00:00');
                days.push({ 
                    date: slot.dayDate, 
                    label: `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`
                });
            }
        });
        return days;
    }, [currentSlots, monthNames]);

    const currentMonth = useMemo(() => {
        if (currentSlots.length === 0) return null;
        return new Date(currentSlots[0].dayDate + 'T12:00:00').getMonth();
    }, [currentSlots]);

    const sidebarRef = useRef(null);

    useEffect(() => {
        if (uniqueDays.length > 0 && !activeDay) {
            setActiveDay(uniqueDays[0].date);
        }
    }, [uniqueDays, activeDay]);

    useEffect(() => {
        if (sidebarRef.current && activeDay) {
            const activeItem = sidebarRef.current.querySelector(`[data-sidebar-day="${activeDay}"]`);
            if (activeItem) {
                const containerHeight = sidebarRef.current.clientHeight;
                const itemTop = activeItem.offsetTop - sidebarRef.current.offsetTop;
                const itemHeight = activeItem.clientHeight;
                
                sidebarRef.current.scrollTo({
                    top: itemTop - (containerHeight / 2) + (itemHeight / 2),
                    behavior: 'smooth'
                });
            }
        }
    }, [activeDay]);

    const handleScroll = () => {
        if (!listRef.current) return;
        const headers = listRef.current.querySelectorAll('[data-day]');
        let current = activeDay;
        for (let header of headers) {
            // Check if the header has passed the top of the container (with a small offset)
            if (header.offsetTop - listRef.current.offsetTop <= listRef.current.scrollTop + 10) {
                current = header.getAttribute('data-day');
            }
        }
        if (current && current !== activeDay) setActiveDay(current);
    };

    const scrollToDay = (dateStr) => {
        if (!listRef.current) return;
        const header = listRef.current.querySelector(`[data-day="${dateStr}"]`);
        if (header) {
            listRef.current.scrollTo({
                top: header.offsetTop - listRef.current.offsetTop,
                behavior: 'smooth'
            });
            setActiveDay(dateStr);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            <nav className={styles.monthBar}>
                {navMonths.map((m, idx) => (
                    <div 
                        key={`m-${idx}`} 
                        className={[styles.monthItem, currentMonth === m.month && styles.monthActive].filter(Boolean).join(' ')}
                        onClick={() => jumpToMonth(m.month, m.year)}
                    >
                        {m.label}
                    </div>
                ))}
            </nav>

            <div className={styles.bodyWrapper}>
                {/* Left Sidebar for Days */}
                <div className={styles.sidebar} ref={sidebarRef}>
                    {uniqueDays.map(day => (
                        <div 
                            key={`sb-${day.date}`} 
                            data-sidebar-day={day.date}
                            className={[styles.sidebarItem, activeDay === day.date && styles.sidebarItemActive].filter(Boolean).join(' ')}
                            onClick={() => scrollToDay(day.date)}
                        >
                            {day.label}
                        </div>
                    ))}
                </div>

                {/* Main Slots List */}
                <div className={styles.list} ref={listRef} onScroll={handleScroll}>
                    {loading && slotsPage === 0 ? <Loading variant="centered" /> : (
                        currentSlots.length > 0 ? (
                            <div className={styles.timeline}>
                                {currentSlots.map((slot, idx) => {
                                    const dateObj = new Date(slot.dayDate + 'T12:00:00');
                                    const showHeader = idx === 0 || currentSlots[idx-1].dayDate !== slot.dayDate;
                                    return (
                                        <React.Fragment key={`s-${slot.iso}-${idx}`}>
                                            {showHeader && (
                                                <div 
                                                    className={styles.dayHeader} 
                                                    data-day={slot.dayDate}
                                                >
                                                    {dateObj.getDate()} {monthNames[dateObj.getMonth()]}
                                                </div>
                                            )}
                                            <div className={[styles.slotRow, slot.is_out_of_hours && styles.slotExtra].filter(Boolean).join(' ')}
                                                 onClick={() => onSelect(slot.iso, slot.is_out_of_hours)}>
                                                <span className={styles.time}>{slot.time} hs</span>
                                                <div className={styles.actions}>
                                                    <Icon name="chat" className={styles.waIcon} onClick={(e) => { e.stopPropagation(); onWhatsApp(slot); }} />
                                                    <span className={styles.selectText}>
                                                        {t('select_short') && t('select_short') !== 'select_short' ? t('select_short') : 'Elegir'}
                                                    </span>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        ) : <div className={styles.empty}>{t('no_slots_found')}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(SlotExplorerDropdown);

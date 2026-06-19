import React, { useMemo } from 'react';
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
    
    // ECC: Use Spanish names in lowercase as requested
    const monthNames = useMemo(() => {
        const translated = t('months_short_array');
        return Array.isArray(translated) ? translated : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    }, [t]);

    const navMonths = useMemo(() => {
        const now = getNow();
        // Show 8 months for better coverage as requested (e.g. including dic)
        return Array.from({ length: 8 }).map((_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            return { 
                label: monthNames[d.getMonth()], 
                month: d.getMonth(), 
                year: d.getFullYear() 
            };
        });
    }, [monthNames]);

    const currentSlots = slotPages[slotsPage] || [];
    const currentMonth = useMemo(() => {
        if (currentSlots.length === 0) return null;
        // Fix: Use slotDate correctly to identify the month
        return new Date(currentSlots[0].dayDate + 'T12:00:00').getMonth();
    }, [currentSlots]);

    if (!isOpen) return null;

    return (
        <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            <header className={styles.header}>
                <span className={styles.title}>{t('find_next_free') || 'Turnos Libres'}</span>
                <Icon name="close" size="1rem" className={styles.closeIcon} onClick={onClose} />
            </header>

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

            <div className={styles.list}>
                {loading && slotsPage === 0 ? <Loading variant="centered" /> : (
                    currentSlots.length > 0 ? (
                        <div className={styles.timeline}>
                            {currentSlots.map((slot, idx) => {
                                const dateObj = new Date(slot.dayDate + 'T12:00:00');
                                const showHeader = idx === 0 || currentSlots[idx-1].dayDate !== slot.dayDate;
                                return (
                                    <React.Fragment key={`s-${slot.iso}-${idx}`}>
                                        {showHeader && (
                                            <div className={styles.dayHeader}>
                                                {dateObj.getDate()} {monthNames[dateObj.getMonth()]}
                                            </div>
                                        )}
                                        <div className={[styles.slotRow, slot.is_out_of_hours && styles.slotExtra].filter(Boolean).join(' ')}
                                             onClick={() => onSelect(slot.iso, slot.is_out_of_hours)}>
                                            <span className={styles.time}>{slot.time} hs</span>
                                            <div className={styles.actions}>
                                                <Icon name="chat" className={styles.waIcon} onClick={(e) => { e.stopPropagation(); onWhatsApp(slot); }} />
                                                <span className={styles.selectText}>{t('select_short') || 'Elegir'}</span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ) : <div className={styles.empty}>{t('no_slots_found')}</div>
                )}
            </div>

            <footer className={styles.footer}>
                <div className={[styles.navBtn, slotsPage === 0 && styles.navBtnDisabled].filter(Boolean).join(' ')}
                     onClick={() => slotsPage > 0 && setSlotsPage(p => p - 1)}>
                    <Icon name="arrow_back" size="1rem" />
                </div>
                <div className={styles.pageInfo}>{slotsPage + 1}/{slotPages.length || 1}</div>
                <div className={[styles.navBtn, !hasNextGroup && slotsPage >= slotPages.length-1 && styles.navBtnDisabled].filter(Boolean).join(' ')}
                     onClick={() => {
                         if (slotsPage < slotPages.length - 1) setSlotsPage(p => p + 1);
                         else if (hasNextGroup) fetchNextFreeSlots(nextSlotData.nextStartDate, null, true);
                     }}>
                    <Icon name="arrow_forward" size="1rem" />
                </div>
            </footer>
        </div>
    );
};

export default React.memo(SlotExplorerDropdown);

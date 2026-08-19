import React, { useMemo } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Loading } from '@/components/atoms/Loading';
import { useLanguage } from '@/hooks/useLanguage';
import { getNow } from '@/utils/core/dateUtils';
import styles from './NextSlotModal.module.css';

/**
 * NextSlotModal (ECC Redesign).
 * Features: Horizontal Month Navigation + Vertical Timeline.
 */
export const NextSlotModal = ({
    isOpen, onClose, loading, nextSlotData, includeOutOfHours, onToggleOutOfHours,
    slotsPage, setSlotsPage, slotPages, onSelect, onWhatsApp, jumpToMonth,
    fetchNextFreeSlots, hasNextGroup
}) => {
    const { t } = useLanguage();
    const monthNames = useMemo(
        () => t('months_short_array') || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        [t]
    );
    
    // Generate next 6 months for navigation bar
    const navMonths = useMemo(() => {
        const now = getNow();
        return Array.from({ length: 6 }).map((_, i) => {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            return {
                label: monthNames[date.getMonth()],
                month: date.getMonth(),
                year: date.getFullYear()
            };
        });
    }, [monthNames]);

    const currentSlots = slotPages[slotsPage] || [];
    const currentMonth = currentSlots.length > 0 ? new Date(currentSlots[0].dayDate + 'T12:00:00').getMonth() : null;

    const handleNext = () => {
        if (slotsPage < slotPages.length - 1) {
            setSlotsPage(p => p + 1);
        } else if (hasNextGroup) {
            fetchNextFreeSlots(nextSlotData.nextStartDate, null, true);
            setSlotsPage(p => p + 1);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('search_free_slots') || "Explorador de Turnos Libres"}
            size="md"
            footer={
                <div className={styles.NextSlotModal__footer}>
                    <Button 
                        variant="secondary" 
                        onClick={() => setSlotsPage(p => Math.max(0, p - 1))}
                        disabled={slotsPage === 0 || loading}
                        icon={<Icon name="chevron_left" />}
                    >
                        {t('prev') || 'Ant.'}
                    </Button>
                    
                    <div className={styles.NextSlotModal__pageInfo}>
                        {slotsPage + 1} / {slotPages.length || 1}
                    </div>

                    <Button 
                        variant="primary" 
                        onClick={handleNext}
                        disabled={loading || (slotsPage >= slotPages.length - 1 && !hasNextGroup)}
                        iconRight={<Icon name="chevron_right" />}
                    >
                        {t('next') || 'Prox.'}
                    </Button>
                </div>
            }
        >
            <div className={styles.NextSlotModal__root}>
                {/* 1. Horizontal Month Bar */}
                <nav className={styles.NextSlotModal__monthBar}>
                    {navMonths.map((m, idx) => (
                        <button
                            type="button"
                            key={`month-${m.month}-${m.year}`} 
                            className={`${styles.NextSlotModal__monthItem} ${currentMonth === m.month ? styles.NextSlotModal__monthActive : ''}`}
                            onClick={() => jumpToMonth(m.month, m.year)}
                        >
                            {m.label}
                        </button>
                    ))}
                </nav>

                {/* 2. Extra Options */}
                <div className={styles.NextSlotModal__options}>
                    <label className={styles.NextSlotModal__checkboxLabel}>
                        <input 
                            type="checkbox" 
                            checked={includeOutOfHours} 
                            onChange={e => onToggleOutOfHours(e.target.checked)} 
                        />
                        <span>{t('include_overtime') || 'Incluir fuera de horario'}</span>
                    </label>
                </div>

                {/* 3. Slot Timeline List */}
                <div className={styles.NextSlotModal__content}>
                    {loading && <Loading variant="centered" />}
                    {!loading && currentSlots.length === 0 && (
                        <div className={styles.NextSlotModal__empty}>{t('no_slots_found')}</div>
                    )}
                    
                    <div className={styles.NextSlotModal__timeline}>
                        {currentSlots.map((slot, idx) => {
                            const date = new Date(slot.dayDate + 'T12:00:00');
                            const showDateHeader = idx === 0 || currentSlots[idx-1].dayDate !== slot.dayDate;

                            return (
                                <React.Fragment key={`slot-${slot.iso}`}>
                                    {showDateHeader && (
                                        <div className={styles.NextSlotModal__dateHeader}>
                                            <span className={styles.NextSlotModal__dayNum}>{date.getDate()}</span>
                                            <span className={styles.NextSlotModal__dayMonth}>{monthNames[date.getMonth()]}</span>
                                            <span className={styles.NextSlotModal__dayName}>{slot.dayName}</span>
                                        </div>
                                    )}
                                    <div className={`${styles.NextSlotModal__slotItem} ${slot.is_out_of_hours ? styles.NextSlotModal__slotExtra : ''}`}>
                                        <div className={styles.NextSlotModal__slotTime}>{slot.time} hs</div>
                                        <div className={styles.NextSlotModal__slotActions}>
                                            <Button 
                                                variant="whatsapp" 
                                                size="sm" 
                                                round 
                                                icon={<Icon name="chat" size="1rem"/>} 
                                                onClick={() => onWhatsApp(slot)}
                                            />
                                            <Button 
                                                variant="premium" 
                                                size="sm" 
                                                onClick={() => onSelect(slot.iso, slot.is_out_of_hours)}
                                            >
                                                {t('select')}
                                            </Button>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
};


import React, { Fragment, useEffect } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatDate, getNow, toInputDate } from '@/utils/core/dateUtils';
import { useLanguage } from '@/hooks/useLanguage';
import Loading from '@/components/atoms/Loading';
import styles from './NextSlotModal.module.css';

/**
 * NextSlotModal (Executor Component).
 * Simple list version for searching free slots.
 */
const NextSlotModal = ({
    isOpen, onClose, loading, nextSlotData, includeOutOfHours, onToggleOutOfHours,
    slotsPage, setSlotsPage, slotPages, onSelect, onWhatsApp, onNextGroup, onPrevGroup: _onPrevGroup,
    hasPrevGroup: _hasPrevGroup, hasNextGroup, fetchNextFreeSlots
}) => {
    const { t } = useLanguage();
    const handleNextPage = async () => {
        if (slotsPage < slotPages.length - 1) {
            setSlotsPage(p => p + 1);
        } else if (nextSlotData?.nextStartDate) {
            await fetchNextFreeSlots(nextSlotData.nextStartDate, null, true);
            setSlotsPage(p => p + 1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if ((e.key === 'ArrowLeft' || e.key === 'PageUp') && (slotsPage > 0)) setSlotsPage(p => p - 1);
            else if ((e.key === 'ArrowRight' || e.key === 'PageDown') && (slotsPage < slotPages.length - 1 || nextSlotData?.nextStartDate)) handleNextPage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, slotsPage, slotPages.length, nextSlotData?.nextStartDate]);

    const monthNames = t('months_array');
    const todayIso = toInputDate(getNow());
    const currentSlots = slotPages.length > 0 ? slotPages[Math.min(slotsPage, slotPages.length - 1)] : [];



    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <div className={styles.title}>
                    <Icon name="search" size="1.2rem" />
                    {t('search_free_slots')}
                </div>
            } 
            size="lg"
            className={styles.container}
        >
            <div className={styles.root}>
                <div className={styles.controls}>



                </div>

                {(!nextSlotData || loading) ? (
                    <Loading text={t('exploring_schedule')} />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>

                            <tbody className={styles.tbody}>
                                {currentSlots.map((slot, index) => {
                                    const [y, m] = slot.dayDate.split('-'); 
                                    const isToday = slot.dayDate === todayIso; 
                                    const monthLabel = `${monthNames[parseInt(m) - 1]} ${y}`;
                                    const prevSlot = index > 0 ? currentSlots[index - 1] : null;
                                    const showDayHeader = !prevSlot || prevSlot.dayDate !== slot.dayDate;
                                    const showMonthHeader = !prevSlot || (monthLabel !== `${monthNames[parseInt(prevSlot.dayDate.split('-')[1]) - 1]} ${prevSlot.dayDate.split('-')[0]}`);
                                    
                                    return (
                                        <Fragment key={`${slot.dayDate}-${slot.iso}`}>
                                            {showMonthHeader && (
                                                <tr className={styles.monthHeader}>
                                                    <td colSpan="2" className={styles.monthCell}>
                                                        {monthLabel}
                                                    </td>
                                                </tr>
                                            )}
                                            {showDayHeader && (
                                                <tr className={styles.dayHeader}>
                                                    <td colSpan="2" className={styles.dayCell}>
                                                        <div className={styles.dayContent}>
                                                            <Icon name="event" size="1rem" className={styles.dayIcon} />
                                                            <span className={styles.dayName}>{slot.dayName}</span>
                                                            {isToday && (
                                                                <span className={styles.todayBadge}>
                                                                    {t('today')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className={`${styles.slotRow} ${slot.is_out_of_hours ? styles.slotRowOutOfHours : ''}`}>
                                                <td className={styles.slotCell}>
                                                    <div className={styles.slotContent}>
                                                        <span className={`${styles.slotTime} ${slot.is_out_of_hours ? styles.slotTimeOutOfHours : styles.slotTimeNormal}`}>
                                                            {slot.time}
                                                        </span>
                                                        {slot.is_break && (
                                                            <span className={`${styles.slotBadge} ${styles.slotBadgeExtra}`}>
                                                                EXT
                                                            </span>
                                                        )}
                                                        {slot.is_out_of_hours && (
                                                            <span className={`${styles.slotBadge} ${styles.slotBadgeOutOfHours}`}>
                                                                EXTRA
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <div className={styles.actionsContent}>
                                                        <Button 
                                                            variant="whatsapp"
                                                            size="icon"
                                                            round
                                                            onClick={() => onWhatsApp({ ...slot, dayName: slot.dayName?.split(' ')[0] || formatDate(slot.iso, { weekday: true }), formattedDate: formatDate(slot.iso, { monthName: true }) })}
                                                            icon={<Icon name="chat" size="1.2rem" />}
                                                        />
                                                        <Button 
                                                            variant={slot.is_out_of_hours ? "accent" : "dark"}
                                                            size="md"
                                                            className={styles.selectBtn}
                                                            onClick={() => onSelect(slot.iso, slot.is_out_of_hours)}
                                                        >
                                                            {t('select')}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className={styles.pagination}>
                    <div className={styles.toggleRow}>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                className={styles.toggleCheckbox}
                                checked={includeOutOfHours}
                                onChange={(e) => onToggleOutOfHours(e.target.checked)}
                            />
                            <span className={styles.toggleText}>
                                <Icon name="lock_open" size="1rem" />
                                {t('include_overtime_short')}
                            </span>
                        </label>
                    </div>

                    <div className={styles.paginationControls}>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSlotsPage(p => Math.max(0, p - 1))} 
                            disabled={slotsPage === 0 || loading}
                            icon={<Icon name="chevron_left" size="1.1rem" />}
                        >
                            {t('previous')}
                        </Button>
                        <span className={styles.pageInfo}>
                            {slotsPage + 1} / {slotPages.length}
                        </span>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={onNextGroup} 
                            disabled={loading || (slotsPage >= slotPages.length - 1 && !hasNextGroup)}
                            iconRight={<Icon name={slotsPage >= slotPages.length - 1 && hasNextGroup ? "search" : "chevron_right"} size="1.1rem" />}
                        >
                            {slotsPage >= slotPages.length - 1 && hasNextGroup ? t('explore_more_dates') : t('next')}
                        </Button>
                    </div>
                </div>



            </div>
        </Modal>
    );
};

export default NextSlotModal;

import React, { Fragment, useEffect } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatDate } from '@/utils/dateUtils';
import { useLanguage } from '@/context/LanguageContext';
import './NextSlotModal.css';

/**
 * NextSlotModal (Executor Component).
 * Simple list version for searching free slots.
 */
const NextSlotModal = ({
    isOpen, onClose, loading, nextSlotData, includeOutOfHours, onToggleOutOfHours,
    slotsPage, setSlotsPage, slotPages, onSelect, onWhatsApp, onNextGroup, onPrevGroup,
    hasPrevGroup, hasNextGroup
}) => {
    const { t } = useLanguage();
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if ((e.key === 'ArrowLeft' || e.key === 'PageUp') && hasPrevGroup) onPrevGroup();
            else if ((e.key === 'ArrowRight' || e.key === 'PageDown') && hasNextGroup) onNextGroup();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, hasPrevGroup, hasNextGroup, onPrevGroup, onNextGroup]);

    const monthNames = t('months_array');
    const todayIso = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).split(' ')[0];
    const currentSlots = slotPages.length > 0 ? slotPages[Math.min(slotsPage, slotPages.length - 1)] : [];

    const baseClass = 'next-slot-modal';

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <div className={`${baseClass}__title`}>
                    <Icon name="search" size="1.2rem" />
                    {t('search_free_slots')}
                </div>
            } 
            size="lg"
        >
            <div className={baseClass}>
                <div className={`${baseClass}__info-box`}>
                    <div className={`${baseClass}__info-content`}>
                        <Icon name="info" size="1.1rem" className={`${baseClass}__info-icon`} />
                        <p className={`${baseClass}__info-text`}>{t('search_limit_3_months')}</p>
                    </div>
                </div>

                <div className={`${baseClass}__toggle-row`}>
                    <label className={`${baseClass}__toggle-label`}>
                        <input 
                            type="checkbox" 
                            className={`${baseClass}__toggle-checkbox`} 
                            checked={includeOutOfHours} 
                            onChange={(e) => onToggleOutOfHours(e.target.checked)} 
                        />
                        <span className={`${baseClass}__toggle-text`}>
                            <Icon name="lock_open" size="1rem" />
                            {t('include_overtime_short')}
                        </span>
                    </label>
                </div>

                {(!nextSlotData || loading) ? (
                    <div className={`${baseClass}__loading`}>
                        <div className="loading-spinner-small"></div>
                        <p className={`${baseClass}__loading-text`}>{t('exploring_schedule')}</p>
                    </div>
                ) : (
                    <div className={`${baseClass}__table-wrapper`}>
                        <table className={`${baseClass}__table`}>
                            <thead className={`${baseClass}__thead`}>
                                <tr>
                                    <th className={`${baseClass}__th`}>{t('time_date')}</th>
                                    <th className={`${baseClass}__th ${baseClass}__th--right`}>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className={`${baseClass}__tbody`}>
                                {currentSlots.map((slot, index) => {
                                    const [y, m] = slot.dayDate.split('-'); 
                                    const isToday = slot.dayDate === todayIso; 
                                    const monthLabel = `${monthNames[parseInt(m) - 1]} ${y}`;
                                    const prevSlot = index > 0 ? currentSlots[index - 1] : null;
                                    const showDayHeader = !prevSlot || prevSlot.dayDate !== slot.dayDate;
                                    const showMonthHeader = !prevSlot || (monthLabel !== `${monthNames[parseInt(prevSlot.dayDate.split('-')[1]) - 1]} ${prevSlot.dayDate.split('-')[0]}`);
                                    
                                    return (
                                        <Fragment key={`${slot.dayDate}-${slot.iso}-${index}`}>
                                            {showMonthHeader && (
                                                <tr className={`${baseClass}__month-header`}>
                                                    <td colSpan="2" className={`${baseClass}__month-cell`}>
                                                        {monthLabel}
                                                    </td>
                                                </tr>
                                            )}
                                            {showDayHeader && (
                                                <tr className={`${baseClass}__day-header`}>
                                                    <td colSpan="2" className={`${baseClass}__day-cell`}>
                                                        <div className={`${baseClass}__day-content`}>
                                                            <Icon name="event" size="1rem" className={`${baseClass}__day-icon`} />
                                                            <span className={`${baseClass}__day-name`}>{slot.dayName}</span>
                                                            {isToday && (
                                                                <span className={`${baseClass}__today-badge`}>
                                                                    {t('today')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className={`${baseClass}__slot-row ${slot.is_out_of_hours ? `${baseClass}__slot-row--out-of-hours` : ''}`}>
                                                <td className={`${baseClass}__slot-cell`}>
                                                    <div className={`${baseClass}__slot-content`}>
                                                        <span className={`${baseClass}__slot-time ${slot.is_out_of_hours ? `${baseClass}__slot-time--out-of-hours` : `${baseClass}__slot-time--normal`}`}>
                                                            {slot.time}
                                                        </span>
                                                        {slot.is_break && (
                                                            <span className={`${baseClass}__slot-badge ${baseClass}__slot-badge--extra`}>
                                                                EXT
                                                            </span>
                                                        )}
                                                        {slot.is_out_of_hours && (
                                                            <span className={`${baseClass}__slot-badge ${baseClass}__slot-badge--out-of-hours`}>
                                                                EXTRA
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={`${baseClass}__actions-cell`}>
                                                    <div className={`${baseClass}__actions-content`}>
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
                                                            className={`${baseClass}__select-btn`}
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

                {nextSlotData?.results && (
                    <div className={`${baseClass}__pagination`}>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSlotsPage(p => Math.max(0, p - 1))} 
                            disabled={slotsPage === 0}
                            icon={<Icon name="chevron_left" size="1.1rem" />}
                        >
                            {t('previous_month')}
                        </Button>
                        <span className={`${baseClass}__page-info`}>
                            {t('page_x')?.replace('{page}', slotsPage + 1)}
                        </span>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSlotsPage(p => p + 1)} 
                            disabled={slotsPage >= slotPages.length - 1}
                            iconRight={<Icon name="chevron_right" size="1.1rem" />}
                        >
                            {t('next_month')}
                        </Button>
                    </div>
                )}

                <div className={`${baseClass}__footer-nav`}>
                    {hasPrevGroup && (
                        <Button 
                            variant="secondary" 
                            className={`${baseClass}__footer-btn`} 
                            onClick={onPrevGroup}
                        >
                            <Icon name="chevron_left" size="1.2rem" />
                            <span className={`${baseClass}__footer-btn-label`}>{t('previous_month')}</span>
                        </Button>
                    )}
                    {hasNextGroup && (
                        <Button 
                            variant="secondary" 
                            className={`${baseClass}__footer-btn ${baseClass}__footer-btn--explore`} 
                            onClick={onNextGroup}
                        >
                            <Icon name="search" size="1.2rem" />
                            <span className={`${baseClass}__footer-btn-text--explore`}>{t('explore_more_dates')}</span>
                        </Button>
                    )}
                </div>

                <div className={`${baseClass}__help-footer`}>
                    <span>{t('keyboard_nav_help')}</span>
                    <button className={`${baseClass}__close-btn`} onClick={onClose}>{t('close')}</button>
                </div>
            </div>
        </Modal>
    );
};

export default NextSlotModal;


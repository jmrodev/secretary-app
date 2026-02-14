import React, { Fragment, useEffect } from 'react';
import Modal from './Modal';
import { formatDate } from '../../utils/dateUtils';
import { useLanguage } from '../../context/LanguageContext';
import Icon from '../atoms/Icon';

const NextSlotModal = ({
    isOpen,
    onClose,
    loading,
    nextSlotData,
    includeOutOfHours,
    onToggleOutOfHours,
    slotsPage,
    setSlotsPage,
    slotPages,
    onSelect,
    onWhatsApp,
    onNextGroup,
    onPrevGroup,
    hasPrevGroup,
    hasNextGroup
}) => {
    const { t } = useLanguage();

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                if (hasPrevGroup) onPrevGroup();
            } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                if (hasNextGroup) onNextGroup();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, hasPrevGroup, hasNextGroup, onPrevGroup, onNextGroup]);

    const monthNames = t('months_array');
    const todayIso = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).split(' ')[0];

    const currentSlots = slotPages.length > 0 ? slotPages[Math.min(slotsPage, slotPages.length - 1)] : [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Icon name="search" size="1.2rem" />
                    {t('search_free_slots')}
                </div>
            }
            size="lg"
        >
            <div className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar p-2">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mx-2">
                    <div className="flex items-center gap-2">
                        <Icon name="info" size="1.1rem" className="text-blue-600" />
                        <p className="text-xs font-semibold text-blue-800">
                            {t('search_limit_3_months')}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end px-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-gray-300"
                            checked={includeOutOfHours}
                            onChange={(e) => onToggleOutOfHours(e.target.checked)}
                        />
                        <span className="text-sm font-bold text-amber-800 flex items-center gap-1">
                            <Icon name="lock_open" size="1rem" />
                            {t('include_overtime_short')}
                        </span>
                    </label>
                </div>

                {(!nextSlotData || loading) ? (
                    <div className="text-center p-12 text-main-500 flex flex-col items-center gap-3">
                        <div className="loading-spinner-small"></div>
                        <p className="font-medium">{t('exploring_schedule')}</p>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">{t('time_date')}</th>
                                    <th className="px-5 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentSlots.map((slot, index) => {
                                    const [y, m, d] = slot.dayDate.split('-');
                                    const isToday = slot.dayDate === todayIso;
                                    const monthLabel = `${monthNames[parseInt(m) - 1]} ${y}`;

                                    const prevSlot = index > 0 ? currentSlots[index - 1] : null;
                                    const showDayHeader = !prevSlot || prevSlot.dayDate !== slot.dayDate;
                                    const showMonthHeader = !prevSlot || (monthLabel !== `${monthNames[parseInt(prevSlot.dayDate.split('-')[1]) - 1]} ${prevSlot.dayDate.split('-')[0]}`);

                                    return (
                                        <Fragment key={`${slot.dayDate}-${slot.iso}-${index}`}>
                                            {showMonthHeader && (
                                                <tr className="bg-slate-900 border-y border-slate-800">
                                                    <td colSpan="2" className="px-5 py-2 text-center text-white">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Icon name="calendar_today" size="0.9rem" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                                                {monthLabel}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {showDayHeader && (
                                                <tr className="bg-slate-100">
                                                    <td colSpan="2" className="px-5 py-2 border-b border-slate-200">
                                                        <div className="flex items-center gap-2">
                                                            <Icon name="event" size="1rem" className="text-main-700" />
                                                            <span className="text-[11px] font-black text-main-700 uppercase tracking-widest">
                                                                {slot.dayName}
                                                            </span>
                                                            {isToday && (
                                                                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">{t('today')}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className={`group transition-colors ${slot.is_out_of_hours ? 'bg-amber-50/70 hover:bg-amber-100/50' : 'hover:bg-slate-50/50'}`}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-black leading-none ${slot.is_out_of_hours ? 'text-amber-800' : 'text-main-900'}`}>
                                                            {slot.time}
                                                        </span>
                                                        {slot.is_break && (
                                                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase border border-amber-200">EXT</span>
                                                        )}
                                                        {slot.is_out_of_hours && (
                                                            <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-black uppercase border border-orange-200">EXTRA</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all border border-green-100 shadow-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const dayName = formatDate(slot.iso, { weekday: true });
                                                                const dateStr = formatDate(slot.iso, { monthName: true });

                                                                // Use the pre-computed dayName if available for better reliability
                                                                const finalDayName = slot.dayName ? slot.dayName.split(' ')[0] : dayName;

                                                                onWhatsApp({
                                                                    ...slot,
                                                                    dayName: finalDayName,
                                                                    formattedDate: dateStr,
                                                                });
                                                            }}
                                                            title={t('share_whatsapp')}
                                                        >
                                                            <Icon name="chat" size="1.2rem" />
                                                        </button>
                                                        <button
                                                            className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 ${slot.is_out_of_hours ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                                                            onClick={() => onSelect(slot.iso, slot.is_out_of_hours)}
                                                        >
                                                            {t('select')}
                                                        </button>
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

                {/* Pagination Controls */}
                {nextSlotData?.results && (
                    <div className="flex justify-between items-center px-2">
                        <button
                            className="btn btn-sm btn-secondary flex items-center gap-1"
                            onClick={() => setSlotsPage(p => Math.max(0, p - 1))}
                            disabled={slotsPage === 0}
                        >
                            <Icon name="chevron_left" size="1.1rem" />
                            {t('previous_month') || 'Anterior'}
                        </button>
                        <span className="text-xs font-bold text-slate-500">{t('page_x').replace('{page}', slotsPage + 1)}</span>
                        <button
                            className="btn btn-sm btn-secondary flex items-center gap-1"
                            onClick={() => setSlotsPage(p => p + 1)}
                            disabled={slotsPage >= slotPages.length - 1}
                        >
                            {t('next_month') || 'Siguiente'}
                            <Icon name="chevron_right" size="1.1rem" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-4 mt-2 px-2">
                    {hasPrevGroup && (
                        <button
                            className="flex-1 btn btn-secondary py-5 flex flex-col items-center gap-1 rounded-2xl border-2 hover:bg-slate-50 transition-all font-bold"
                            onClick={onPrevGroup}
                        >
                            <Icon name="chevron_left" size="1.2rem" />
                            <span className="text-xs uppercase tracking-widest text-muted">{t('previous_month') || 'Anteriores'}</span>
                        </button>
                    )}
                    {hasNextGroup && (
                        <button
                            className="flex-[2] btn btn-secondary py-5 flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                            onClick={onNextGroup}
                        >
                            <Icon name="search" size="1.2rem" className="text-blue-600 group-hover:scale-125 transition-transform" />
                            <span className="text-xs uppercase tracking-widest font-black text-blue-600">{t('explore_more_dates')}</span>
                        </button>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-muted uppercase font-bold tracking-tighter">
                    <span>{t('keyboard_nav_help')}</span>
                    <button className="btn btn-sm btn-ghost" onClick={onClose}>{t('close')}</button>
                </div>
            </div>
        </Modal>
    );
};

export default NextSlotModal;

import React, { Fragment, useEffect } from 'react';
import Modal from './Modal';

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

    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const todayIso = new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).split(' ')[0];

    const currentSlots = slotPages.length > 0 ? slotPages[Math.min(slotsPage, slotPages.length - 1)] : [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="🔍 Búsqueda de Turnos Libres"
            size="lg"
        >
            <div className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar p-2">
                <div className="flex justify-end px-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-gray-300"
                            checked={includeOutOfHours}
                            onChange={(e) => onToggleOutOfHours(e.target.checked)}
                        />
                        <span className="text-sm font-bold text-amber-800">🔓 Mostrar fuera de horario (08:00 - 21:00)</span>
                    </label>
                </div>

                {(!nextSlotData || loading) ? (
                    <div className="text-center p-12 text-main-500 flex flex-col items-center gap-3">
                        <div className="loading-spinner-small"></div>
                        <p className="font-medium">Explorando agenda en busca de huecos...</p>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Horario / Fecha</th>
                                    <th className="px-5 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Acción</th>
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
                                                    <td colSpan="2" className="px-5 py-2 text-center">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                                            🗓️ {monthLabel}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )}
                                            {showDayHeader && (
                                                <tr className="bg-slate-100">
                                                    <td colSpan="2" className="px-5 py-2 border-b border-slate-200">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-black text-main-700 uppercase tracking-widest">
                                                                📅 {slot.dayName}
                                                            </span>
                                                            {isToday && (
                                                                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase">HOY</span>
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
                                                            onClick={(e) => { e.stopPropagation(); onWhatsApp(slot); }}
                                                            title="Compartir por WhatsApp"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2001/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 ${slot.is_out_of_hours ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                                                            onClick={() => onSelect(slot.iso)}
                                                        >
                                                            Seleccionar
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
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSlotsPage(p => Math.max(0, p - 1))}
                            disabled={slotsPage === 0}
                        >
                            ⬅️ Anterior
                        </button>
                        <span className="text-xs font-bold text-slate-500">Página {slotsPage + 1}</span>
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSlotsPage(p => p + 1)}
                            disabled={slotsPage >= slotPages.length - 1}
                        >
                            Siguiente ➡️
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-4 mt-2 px-2">
                    {hasPrevGroup && (
                        <button
                            className="flex-1 btn btn-secondary py-5 flex flex-col items-center gap-1 rounded-2xl border-2 hover:bg-slate-50 transition-all font-bold"
                            onClick={onPrevGroup}
                        >
                            <span className="text-xl">⬅️</span>
                            <span className="text-xs uppercase tracking-widest text-muted">Anteriores</span>
                        </button>
                    )}
                    {hasNextGroup && (
                        <button
                            className="flex-[2] btn btn-secondary py-5 flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                            onClick={onNextGroup}
                        >
                            <span className="text-xl group-hover:scale-125 transition-transform">🔍</span>
                            <span className="text-xs uppercase tracking-widest font-black text-blue-600">Explorar más fechas</span>
                        </button>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-muted uppercase font-bold tracking-tighter">
                    <span>Use las flechas del teclado para navegar</span>
                    <button className="btn btn-sm btn-ghost" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </Modal>
    );
};

export default NextSlotModal;

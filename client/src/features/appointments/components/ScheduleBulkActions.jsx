import React from 'react';
import Button from '../../../components/atoms/Button';

/**
 * ScheduleBulkActions Feature Molecule.
 * Orchestrates applying specific time ranges to multiple days simultaneously in the schedule setup.
 * Centralized logic for rapid availability planning within the appointments domain.
 */
const ScheduleBulkActions = ({ bulkStart, setBulkStart, bulkEnd, setBulkEnd, onApplyBulk, t }) => {
    return (
        <div className="schedule-bulk p-6 bg-slate-50 border border-slate-100 rounded-sm mb-8 animate-fadeIn">
            <h4 className="schedule-bulk__title text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="text-lg">🗓️</span>
                Aplicar a múltiples días (Sobrescribe horarios)
            </h4>
            <div className="schedule-bulk__actions flex flex-wrap items-center gap-6">
                <div className="schedule-bulk__time-inputs flex items-center gap-3">
                    <input
                        type="time"
                        className="input-field schedule-bulk__time-input !w-auto !py-1 px-3 border-slate-200 focus:border-accent text-sm"
                        value={bulkStart}
                        onChange={(e) => setBulkStart(e.target.value)}
                    />
                    <span className="schedule-bulk__separator font-medium text-slate-400 lowercase italic text-xs">a</span>
                    <input
                        type="time"
                        className="input-field schedule-bulk__time-input !w-auto !py-1 px-3 border-slate-200 focus:border-accent text-sm"
                        value={bulkEnd}
                        onChange={(e) => setBulkEnd(e.target.value)}
                    />
                </div>
                <div className="schedule-bulk__buttons flex gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyBulk([1, 2, 3, 4, 5])}
                        className="text-[10px] font-bold uppercase tracking-wider h-9"
                    >
                        Lunes a Viernes
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyBulk([1, 2, 3, 4, 5, 6])}
                        className="text-[10px] font-bold uppercase tracking-wider h-9"
                    >
                        Lunes a Sábado
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleBulkActions;

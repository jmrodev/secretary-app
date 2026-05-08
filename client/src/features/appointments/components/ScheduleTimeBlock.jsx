import React from 'react';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';

/**
 * ScheduleTimeBlock Feature Molecule.
 * Represents a single configurable time interval within a doctor's availability schedule.
 * Handles time selection, modality (virtual/presential), and hour alignment.
 */
const ScheduleTimeBlock = ({
    block,
    onFocus,
    onBlur,
    onChange,
    onRemove,
    t
}) => {
    return (
        <div className="time-block p-4 bg-white border border-slate-100 rounded-sm flex flex-wrap items-center gap-4 shadow-sm animate-fade-in mb-3">
            <div className="time-block__inputs flex items-center gap-2">
                <Input
                    type="time"
                    size="sm"
                    className="!py-1 !px-2 border-slate-200 focus:border-accent text-sm w-[90px]"
                    value={String(block.start_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'start_time', e.target.value)}
                />
                <span className="time-block__connector text-[10px] font-bold text-slate-300 uppercase tracking-tighter">a</span>
                <Input
                    type="time"
                    size="sm"
                    className="!py-1 !px-2 border-slate-200 focus:border-accent text-sm w-[90px]"
                    value={String(block.end_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'end_time', e.target.value)}
                />
            </div>

            <div className="time-block__divider w-px h-8 bg-slate-100 hidden md:block" />

            <div className="time-block__type">
                <select
                    className={`time-block__type-select py-1.5 px-3 rounded-sm border-slate-200 text-sm font-bold transition-all focus:ring-2 focus:ring-accent/20 ${block.default_type === 'virtual' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-slate-700 bg-white'}`}
                    value={block.default_type || 'consultation'}
                    onChange={(e) => onChange(block.originalIndex, 'default_type', e.target.value)}
                >
                    <option value="consultation">Presencial</option>
                    <option value="virtual">Videollamada</option>
                </select>
            </div>

            <div className="time-block__options flex items-center gap-4 ml-auto">
                <label className="time-block__alignment flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        className="time-block__checkbox rounded-sm text-accent focus:ring-accent border-slate-300"
                        checked={block.force_hour_alignment === 1}
                        onChange={(e) => onChange(block.originalIndex, 'force_hour_alignment', e.target.checked ? 1 : 0)}
                    />
                    <span className="time-block__alignment-text text-xs font-bold text-slate-400 group-hover:text-accent transition-colors"><Icon name="schedule" size="1rem" className="mr-1" />Coord. :00</span>
                </label>

                <Button
                    variant="ghost"
                    size="sm-compact"
                    onClick={onRemove}
                    className="time-block__remove text-gray-300 hover:text-red-500 hover:bg-red-50 p-2"
                    title="Eliminar franja"
                    icon={<Icon name="delete" />}
                />
            </div>
        </div>
    );
};

export default ScheduleTimeBlock;

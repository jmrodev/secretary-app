import React from 'react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';

/**
 * ScheduleTimeBlock Molecule.
 * Represents a single time interval within a doctor's schedule.
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
        <div className="time-block">
            <div className="time-block__inputs">
                <Input
                    type="time"
                    size="sm"
                    value={String(block.start_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'start_time', e.target.value)}
                />
                <span className="time-block__connector">a</span>
                <Input
                    type="time"
                    size="sm"
                    value={String(block.end_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'end_time', e.target.value)}
                />
            </div>

            <div className="time-block__divider" />

            <div className="time-block__type">
                <select
                    className={`time-block__type-select ${block.default_type === 'virtual' ? 'time-block__type-select--virtual' : ''}`}
                    value={block.default_type || 'consultation'}
                    onChange={(e) => onChange(block.originalIndex, 'default_type', e.target.value)}
                >
                    <option value="consultation">🏥 Presencial</option>
                    <option value="virtual">📹 Videollamada</option>
                </select>
            </div>

            <div className="time-block__options">
                <label className="time-block__alignment">
                    <input
                        type="checkbox"
                        className="time-block__checkbox"
                        checked={block.force_hour_alignment === 1}
                        onChange={(e) => onChange(block.originalIndex, 'force_hour_alignment', e.target.checked ? 1 : 0)}
                    />
                    <span className="time-block__alignment-text">🕒 Coord. :00</span>
                </label>
            </div>

            <Button
                variant="ghost"
                size="sm-compact"
                onClick={onRemove}
                className="time-block__remove"
                title="Eliminar franja"
                icon="🗑️"
            />
        </div>
    );
};

export default ScheduleTimeBlock;

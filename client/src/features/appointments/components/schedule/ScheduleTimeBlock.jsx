import React from 'react';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import Select from '@/components/atoms/Select';

/**
 * ScheduleTimeBlock Feature Molecule.
 * Represents a single configurable time interval within a doctor's availability schedule.
 */
const ScheduleTimeBlock = ({
    block, onFocus, onBlur, onChange, onRemove, t
}) => {
    const typeOptions = [
        { value: 'consultation', label: t('in_person') || 'Presencial' },
        { value: 'virtual', label: t('virtual_type') || 'Videollamada' }
    ];

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
                <span className="time-block__connector">{t('to_label') || 'a'}</span>
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
                <Select
                    size="sm"
                    className={block.default_type === 'virtual' ? 'time-block__type-select--virtual' : ''}
                    value={block.default_type || 'consultation'}
                    onChange={(e) => onChange(block.originalIndex, 'default_type', e.target.value)}
                    options={typeOptions}
                />
            </div>

            <div className="time-block__options">
                <label className="time-block__alignment">
                    <input
                        type="checkbox"
                        className="time-block__checkbox"
                        checked={block.force_hour_alignment === 1}
                        onChange={(e) => onChange(block.originalIndex, 'force_hour_alignment', e.target.checked ? 1 : 0)}
                    />
                    <span className="time-block__alignment-text">
                        <Icon name="schedule" size="1rem" />
                        Coord. :00
                    </span>
                </label>

                <Button
                    variant="ghost"
                    size="sm-compact"
                    onClick={onRemove}
                    className="time-block__remove"
                    title="Eliminar franja"
                    icon={<Icon name="delete" />}
                />
            </div>
        </div>
    );
};

export default ScheduleTimeBlock;

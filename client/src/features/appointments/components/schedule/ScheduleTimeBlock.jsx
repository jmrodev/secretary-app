import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';
import { Select } from '@/components/atoms/Select';
import styles from './ScheduleTimeBlock.module.css';

/**
 * ScheduleTimeBlock Feature Molecule.
 * Represents a single configurable time interval within a doctor's availability schedule.
 */
export const ScheduleTimeBlock = ({
    block, onFocus, onBlur, onChange, onRemove, t
}) => {
    const typeOptions = [
        { value: 'consultation', label: t('in_person') },
        { value: 'virtual', label: t('virtual_type') }
    ];

    return (
        <div className={`${styles.ScheduleTimeBlock__container}`}>
            <div className={`${styles.ScheduleTimeBlock__inputs}`}>
                <Input
                    type="time"
                    size="sm"
                    value={String(block.start_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'start_time', e.target.value)}
                />
                <span className={`${styles.ScheduleTimeBlock__connector}`}>{t('to_label')}</span>
                <Input
                    type="time"
                    size="sm"
                    value={String(block.end_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'end_time', e.target.value)}
                />
            </div>

            <div className={`${styles.ScheduleTimeBlock__divider}`} />

            <div className={styles.ScheduleTimeBlock__typeContainer}>
                <Select
                    size="sm"
                    className={block.default_type === 'virtual' ? styles.ScheduleTimeBlock__typeSelectVirtual : ''}
                    value={block.default_type || 'consultation'}
                    onChange={(e) => onChange(block.originalIndex, 'default_type', e.target.value)}
                    options={typeOptions}
                />
            </div>

            <div className={`${styles.ScheduleTimeBlock__options}`}>
                <label className={`${styles.ScheduleTimeBlock__alignment}`}>
                    <input
                        type="checkbox"
                        className={`${styles.ScheduleTimeBlock__checkbox}`}
                        checked={block.force_hour_alignment === 1}
                        onChange={(e) => onChange(block.originalIndex, 'force_hour_alignment', e.target.checked ? 1 : 0)}
                    />
                    <span className={`${styles.ScheduleTimeBlock__alignmentText}`}>
                        <Icon name="schedule" size="1rem" />
                        Coord. :00
                    </span>
                </label>

                <Button
                    variant="ghost"
                    size="sm-compact"
                    onClick={onRemove}
                    className={`${styles.ScheduleTimeBlock__remove}`}
                    title={t('remove_time_slot')}
                    icon={<Icon name="delete" />}
                />
            </div>
        </div>
    );
};


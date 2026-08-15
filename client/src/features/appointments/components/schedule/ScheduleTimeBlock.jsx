import React from 'react';
import { Button } from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import Select from '@/components/atoms/Select';
import styles from './ScheduleTimeBlock.module.css';

/**
 * ScheduleTimeBlock Feature Molecule.
 * Represents a single configurable time interval within a doctor's availability schedule.
 */
export const ScheduleTimeBlock = ({
    block, onFocus, onBlur, onChange, onRemove, t
}) => {
    const typeOptions = [
        { value: 'consultation', label: t('in_person') || 'Presencial' },
        { value: 'virtual', label: t('virtual_type') || 'Videollamada' }
    ];

    return (
        <div className={`${styles.container}`}>
            <div className={`${styles.inputs}`}>
                <Input
                    type="time"
                    size="sm"
                    value={String(block.start_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'start_time', e.target.value)}
                />
                <span className={`${styles.connector}`}>{t('to_label') || 'a'}</span>
                <Input
                    type="time"
                    size="sm"
                    value={String(block.end_time || '').slice(0, 5)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={(e) => onChange(block.originalIndex, 'end_time', e.target.value)}
                />
            </div>

            <div className={`${styles.divider}`} />

            <div className={styles.typeContainer}>
                <Select
                    size="sm"
                    className={block.default_type === 'virtual' ? styles.typeSelectVirtual : ''}
                    value={block.default_type || 'consultation'}
                    onChange={(e) => onChange(block.originalIndex, 'default_type', e.target.value)}
                    options={typeOptions}
                />
            </div>

            <div className={`${styles.options}`}>
                <label className={`${styles.alignment}`}>
                    <input
                        type="checkbox"
                        className={`${styles.checkbox}`}
                        checked={block.force_hour_alignment === 1}
                        onChange={(e) => onChange(block.originalIndex, 'force_hour_alignment', e.target.checked ? 1 : 0)}
                    />
                    <span className={`${styles.alignmentText}`}>
                        <Icon name="schedule" size="1rem" />
                        Coord. :00
                    </span>
                </label>

                <Button
                    variant="ghost"
                    size="sm-compact"
                    onClick={onRemove}
                    className={`${styles.remove}`}
                    title="Eliminar franja"
                    icon={<Icon name="delete" />}
                />
            </div>
        </div>
    );
};


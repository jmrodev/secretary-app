import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './ScheduleBulkActions.module.css';

/**
 * ScheduleBulkActions Feature Molecule.
 * Orchestrates applying specific time ranges to multiple days simultaneously in the schedule setup.
 * Centralized logic for rapid availability planning within the appointments domain.
 */
export const ScheduleBulkActions = ({ bulkStart, setBulkStart, bulkEnd, setBulkEnd, onApplyBulk, t }) => {
    return (
        <div className={`${styles.ScheduleBulkActions__root}`}>
            <h4 className={`${styles.ScheduleBulkActions__title}`}>
                <Icon name="calendar_month" size="1.2rem" className={`${styles.ScheduleBulkActions__titleIcon}`} />
                {t('apply_to_multiple_days') || 'Aplicar a múltiples días (Sobrescribe horarios)'}
            </h4>
            <div className={`${styles.ScheduleBulkActions__actions}`}>
                <div className={`${styles.ScheduleBulkActions__timeInputs}`}>
                    <input
                        type="time"
                        className={`input-field ${styles.timeInput}`}
                        value={bulkStart}
                        onChange={(e) => setBulkStart(e.target.value)}
                    />
                    <span className={`${styles.ScheduleBulkActions__separator}`}>{t('to_label') || 'a'}</span>
                    <input
                        type="time"
                        className={`input-field ${styles.timeInput}`}
                        value={bulkEnd}
                        onChange={(e) => setBulkEnd(e.target.value)}
                    />
                </div>
                <div className={`${styles.ScheduleBulkActions__buttons}`}>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyBulk([1, 2, 3, 4, 5])}
                    >
                        <span className={`${styles.ScheduleBulkActions__btnLabel}`}>{t('mon_to_fri') || 'Lunes a Viernes'}</span>
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyBulk([1, 2, 3, 4, 5, 6])}
                    >
                        <span className={`${styles.ScheduleBulkActions__btnLabel}`}>{t('mon_to_sat') || 'Lunes a Sábado'}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};


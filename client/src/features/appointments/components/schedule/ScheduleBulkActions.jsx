import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

/**
 * ScheduleBulkActions Feature Molecule.
 * Orchestrates applying specific time ranges to multiple days simultaneously in the schedule setup.
 * Centralized logic for rapid availability planning within the appointments domain.
 */
const ScheduleBulkActions = ({ bulkStart, setBulkStart, bulkEnd, setBulkEnd, onApplyBulk, t }) => {
    return (
        <div className="schedule-bulk">
            <h4 className="schedule-bulk__title">
                <Icon name="calendar_month" size="1.2rem" className="schedule-bulk__title-icon" />
                {t('apply_to_multiple_days') || 'Aplicar a múltiples días (Sobrescribe horarios)'}
            </h4>
            <div className="schedule-bulk__actions">
                <div className="schedule-bulk__time-inputs">
                    <input
                        type="time"
                        className="input-field schedule-bulk__time-input"
                        value={bulkStart}
                        onChange={(e) => setBulkStart(e.target.value)}
                    />
                    <span className="schedule-bulk__separator">{t('to_label') || 'a'}</span>
                    <input
                        type="time"
                        className="input-field schedule-bulk__time-input"
                        value={bulkEnd}
                        onChange={(e) => setBulkEnd(e.target.value)}
                    />
                </div>
                <div className="schedule-bulk__buttons">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyBulk([1, 2, 3, 4, 5])}
                    >
                        <span className="schedule-bulk__btn-label">{t('mon_to_fri') || 'Lunes a Viernes'}</span>
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyBulk([1, 2, 3, 4, 5, 6])}
                    >
                        <span className="schedule-bulk__btn-label">{t('mon_to_sat') || 'Lunes a Sábado'}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleBulkActions;

import React from 'react';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import './ScheduleBulkActions.css';

/**
 * ScheduleBulkActions Feature Molecule.
 * Orchestrates applying specific time ranges to multiple days simultaneously in the schedule setup.
 * Centralized logic for rapid availability planning within the appointments domain.
 */
const ScheduleBulkActions = ({ bulkStart, setBulkStart, bulkEnd, setBulkEnd, onApplyBulk, t }) => {
    return (
        <div className="schedule-bulk">
            <h4 className="schedule-bulk__title">
                <Icon name="calendar_month" size="1.2rem" />
                {t('bulk_actions_title') || 'Aplicar a múltiples días (Sobrescribe horarios)'}
            </h4>
            <div className="schedule-bulk__actions">
                <div className="schedule-bulk__time-inputs">
                    <Input
                        type="time"
                        className="schedule-bulk__time-input"
                        value={bulkStart}
                        onChange={(e) => setBulkStart(e.target.value)}
                    />
                    <span className="schedule-bulk__separator">{t('bulk_range_separator') || 'a'}</span>
                    <Input
                        type="time"
                        className="schedule-bulk__time-input"
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
                        <span className="schedule-bulk__btn-text">
                            {t('mon_to_fri') || 'Lunes a Viernes'}
                        </span>
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyBulk([1, 2, 3, 4, 5, 6])}
                    >
                        <span className="schedule-bulk__btn-text">
                            {t('mon_to_sat') || 'Lunes a Sábado'}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleBulkActions;

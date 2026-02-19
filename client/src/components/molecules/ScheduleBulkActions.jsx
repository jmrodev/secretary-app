import React from 'react';
import Button from '../atoms/Button';

/**
 * ScheduleBulkActions Molecule.
 * Handles applying a specific time range to multiple days at once.
 */
const ScheduleBulkActions = ({ bulkStart, setBulkStart, bulkEnd, setBulkEnd, onApplyBulk, t }) => {
    return (
        <div className="schedule-bulk">
            <h4 className="schedule-bulk__title">Aplicar a múltiples días (Sobrescribe horarios)</h4>
            <div className="schedule-bulk__actions">
                <div className="schedule-bulk__time-inputs">
                    <input
                        type="time"
                        className="input-field schedule-bulk__time-input"
                        value={bulkStart}
                        onChange={(e) => setBulkStart(e.target.value)}
                    />
                    <span className="schedule-bulk__separator">a</span>
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
                        Lunes a Viernes
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyBulk([1, 2, 3, 4, 5, 6])}
                    >
                        Lunes a Sábado
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleBulkActions;

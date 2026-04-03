
import React from 'react';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';

/**
 * MedicationConfigFields Molecule (Sub-Executor).
 * Handles the configuration of a specific medication, including reminder modes and quantities.
 */
const MedicationConfigFields = ({
    currentMed,
    handleModeChange,
    handleUnitsChange,
    handleBoxesChange,
    handleDailyIntakeChange,
    handleReminderDayChange,
    setCurrentMed,
    handleAddToPending,
    t
}) => {
    return (
        <div className="patient-medications__form-card animate-fadeIn">
            <div className="patient-medications__mode-selector">
                <label className="config-field__label">{t('reminder_mode') || 'Modo de Recordatorio'}</label>
                <div className="config-flex config-flex--gap-2">
                    <Button
                        size="sm-compact"
                        type="button"
                        variant={currentMed.reminder_mode === 'calculation' ? 'primary' : 'secondary'}
                        onClick={() => handleModeChange('calculation')}
                    >
                        {t('mode_calculation') || 'Por Cálculo'}
                    </Button>
                    <Button
                        size="sm-compact"
                        type="button"
                        variant={currentMed.reminder_mode === 'fixed_day' ? 'primary' : 'secondary'}
                        onClick={() => handleModeChange('fixed_day')}
                    >
                        {t('mode_fixed_day') || 'Todos los meses'}
                    </Button>
                    <Button
                        size="sm-compact"
                        type="button"
                        variant={currentMed.reminder_mode === 'fixed_date' ? 'primary' : 'secondary'}
                        onClick={() => handleModeChange('fixed_date')}
                    >
                        {t('mode_fixed_date') || 'Fecha específica'}
                    </Button>
                </div>
            </div>

            {currentMed.reminder_mode === 'calculation' && (
                <div className="patient-medications__config-grid animate-fadeIn">
                    <div className="config-field">
                        <label className="config-field__label">{t('units_per_box') || 'Caja de (X) pastillas'}</label>
                        <select
                            className="config-field__input"
                            value={currentMed.units_per_box}
                            onChange={e => handleUnitsChange(e.target.value)}
                        >
                            <option value="">{t('select_option') || 'Sel.'}</option>
                            {[10, 14, 20, 28, 30, 40, 50, 60, 100].map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    </div>
                    <div className="config-field">
                        <label className="config-field__label">{t('boxes_count') || 'Cantidad de cajas'}</label>
                        <input
                            type="number"
                            min="1"
                            className="config-field__input"
                            value={currentMed.boxes_count}
                            onChange={e => handleBoxesChange(e.target.value)}
                        />
                    </div>
                    <div className="config-field">
                        <label className="config-field__label">{t('daily_intake') || 'Pastillas por día'}</label>
                        <select
                            className="config-field__input"
                            value={currentMed.daily_intake}
                            onChange={e => handleDailyIntakeChange(e.target.value)}
                        >
                            <option value="">{t('select_option') || 'Sel.'}</option>
                            {[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].map(v => (
                                <option key={v} value={v}>
                                    {v === 0.25 ? '1/4' : v === 0.5 ? '1/2' : v === 0.75 ? '3/4' : v}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {currentMed.reminder_mode === 'fixed_day' && (
                <div className="config-field animate-fadeIn">
                    <label className="config-field__label">{t('reminder_day_of_month') || 'Día del mes para el recordatorio'}</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        className="config-field__input"
                        placeholder="Ej: 20"
                        value={currentMed.reminder_day}
                        onChange={e => handleReminderDayChange(e.target.value)}
                    />
                </div>
            )}

            <div className="patient-medications__config-row">
                <div className="config-field">
                    <label className="config-field__label">{t('frequency')}</label>
                    <input
                        className="config-field__input"
                        value={currentMed.frequency}
                        onChange={e => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                        placeholder="Cada 24hs..."
                    />
                </div>
                <div className="config-field">
                    <label className="config-field__label">{t('next_refill_date')}</label>
                    <input
                        type="date"
                        className="config-field__input"
                        value={currentMed.next_refill_date}
                        onChange={e => setCurrentMed({ ...currentMed, next_refill_date: e.target.value })}
                        readOnly={currentMed.reminder_mode !== 'fixed_date'}
                    />
                    {currentMed.reminder_mode !== 'fixed_date' && (
                        <div className="patient-medications__hint">
                            {t('auto_calculated_date') || 'Fecha calculada automáticamente'}
                        </div>
                    )}
                </div>
            </div>

            <div className="patient-medications__config-footer">
                <div className="config-field config-field--flex config-field--no-margin">
                    <input
                        className="config-field__input"
                        value={currentMed.notes}
                        onChange={e => setCurrentMed({ ...currentMed, notes: e.target.value })}
                        placeholder={t('notes_placeholder') || "Notas adicionales..."}
                    />
                </div>
                <div className="config-flex config-flex--gap-2">
                    <input
                        type="checkbox"
                        id="is_chronic"
                        checked={currentMed.is_chronic}
                        onChange={e => setCurrentMed({ ...currentMed, is_chronic: e.target.checked })}
                        className="patient-medications__checkbox"
                    />
                    <label htmlFor="is_chronic" className="patient-medications__checkbox-label">{t('chronic')}</label>
                </div>
                <Button size="sm" type="button" variant="accent" onClick={handleAddToPending} icon={<Icon name="add" size="1.2rem" />}>
                    {t('add_to_list') || 'Agregar'}
                </Button>
            </div>
        </div>
    );
};

export default MedicationConfigFields;

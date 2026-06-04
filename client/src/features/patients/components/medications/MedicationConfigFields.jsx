
import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Switch from '@/components/atoms/Switch';
import styles from './MedicationConfigFields.module.css';

/**
 * MedicationConfigFields Molecule.
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
    const unitsOptions = [
        { value: '', label: t('select_option') },
        ...[10, 14, 20, 28, 30, 40, 50, 60, 100].map(v => ({ value: v, label: v.toString() }))
    ];

    const dailyIntakeOptions = [
        { value: '', label: t('select_option') },
        ...[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].map(v => ({
            value: v,
            label: v === 0.25 ? '1/4' : v === 0.5 ? '1/2' : v === 0.75 ? '3/4' : v.toString()
        }))
    ];

    return (
        <div className={`${styles.root} animate-fade-in`}>
            <div className={`${styles.modeSelector}`}>
                <label className={`${styles.label}`}>{t('reminder_mode')}</label>
                <div className={`${styles.btnGroup}`}>
                    <Button
                        size="sm-compact"
                        type="button"
                        variant={currentMed.reminder_mode === 'calculation' ? 'primary' : 'secondary'}
                        onClick={() => handleModeChange('calculation')}
                    >
                        {t('mode_calculation')}
                    </Button>
                    <Button
                        size="sm-compact"
                        type="button"
                        variant={currentMed.reminder_mode === 'fixed_day' ? 'primary' : 'secondary'}
                        onClick={() => handleModeChange('fixed_day')}
                    >
                        {t('mode_fixed_day')}
                    </Button>
                    <Button
                        size="sm-compact"
                        type="button"
                        variant={currentMed.reminder_mode === 'fixed_date' ? 'primary' : 'secondary'}
                        onClick={() => handleModeChange('fixed_date')}
                    >
                        {t('mode_fixed_date')}
                    </Button>
                </div>
            </div>

            {currentMed.reminder_mode === 'calculation' && (
                <div className={`${styles.grid} animate-fade-in`}>
                    <div className={`${styles.group}`}>
                        <label className={`${styles.label}`}>{t('units_per_box')}</label>
                        <Select
                            value={currentMed.units_per_box}
                            options={unitsOptions}
                            onChange={e => handleUnitsChange(e.target.value)}
                        />
                    </div>
                    <div className={`${styles.group}`}>
                        <label className={`${styles.label}`}>{t('boxes_count')}</label>
                        <Input
                            type="number"
                            min="1"
                            value={currentMed.boxes_count}
                            onChange={e => handleBoxesChange(e.target.value)}
                        />
                    </div>
                    <div className={`${styles.group}`}>
                        <label className={`${styles.label}`}>{t('daily_intake')}</label>
                        <Select
                            value={currentMed.daily_intake}
                            options={dailyIntakeOptions}
                            onChange={e => handleDailyIntakeChange(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {currentMed.reminder_mode === 'fixed_day' && (
                <div className={`${styles.group} animate-fade-in`}>
                    <label className={`${styles.label}`}>{t('reminder_day_of_month')}</label>
                    <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="20"
                        value={currentMed.reminder_day}
                        onChange={e => handleReminderDayChange(e.target.value)}
                    />
                </div>
            )}

            <div className={`${styles.row}`}>
                <div className={`${styles.group}`}>
                    <label className={`${styles.label}`}>{t('frequency')}</label>
                    <Input
                        value={currentMed.frequency}
                        onChange={e => setCurrentMed(prev => ({ ...prev, frequency: e.target.value }))}
                        placeholder={t('frequency_placeholder') || "Cada 24hs..."}
                    />
                </div>
                <div className={`${styles.group}`}>
                    <label className={`${styles.label}`}>{t('next_refill_date')}</label>
                    <Input
                        type="date"
                        value={currentMed.next_refill_date}
                        onChange={e => setCurrentMed(prev => ({ ...prev, next_refill_date: e.target.value }))}
                        disabled={currentMed.reminder_mode !== 'fixed_date'}
                    />
                    {currentMed.reminder_mode !== 'fixed_date' && (
                        <div className={`${styles.hint}`}>
                            {t('auto_calculated_date')}
                        </div>
                    )}
                </div>
            </div>

            <div className={`${styles.footer}`}>
                <div className={`${styles.notes}`}>
                    <Input
                        value={currentMed.notes}
                        onChange={e => setCurrentMed(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder={t('notes_placeholder')}
                    />
                </div>
                
                <Switch
                    id="is_chronic"
                    label={t('chronic')}
                    checked={currentMed.is_chronic}
                    onChange={checked => setCurrentMed(prev => ({ ...prev, is_chronic: checked }))}
                />

                <Button 
                    size="md" 
                    type="button" 
                    variant="accent" 
                    onClick={handleAddToPending} 
                    icon={<Icon name="add" />}
                >
                    {t('add_to_list')}
                </Button>
            </div>
        </div>
    );
};

export default MedicationConfigFields;

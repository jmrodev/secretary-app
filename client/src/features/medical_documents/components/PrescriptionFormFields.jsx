
import React from 'react';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Tooltip from '@/components/atoms/Tooltip';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import MedicationAutocomplete from './MedicationAutocomplete';
import './PrescriptionFormFields.css';


/**
 * PrescriptionFormFields Molecule.
 * Contains medication search, dose, frequency, and numeric fields.
 */
const PrescriptionFormFields = ({
    tempMed, setTempMed,
    tempDose, setTempDose,
    tempFreqPreset, handleFreqPreset,
    tempUnitsPerBox, setTempUnitsPerBox,
    tempDailyUnits, setTempDailyUnits,
    tempBoxes, setTempBoxes,
    handleAddItem, handleSelectMedication,
    canAdd, daysSupply, refillDateStr,
    freqPresets,
    t
}) => {
    const unitsPerBoxOptions = [
        { value: '', label: t('select_option') },
        ...[10, 14, 20, 28, 30, 40, 50, 60, 100].map(v => ({ value: v, label: String(v) }))
    ];

    const dailyUnitsOptions = [
        { value: '', label: t('select_option') },
        ...[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].map(v => ({
            value: v,
            label: v === 0.25 ? '1/4' : v === 0.5 ? '1/2' : v === 0.75 ? '3/4' : String(v)
        }))
    ];

    return (
        <div className="prescription-modal__group">
            <div className="prescription-modal__field-wrapper">
                <label className="prescription-modal__label">{t('medication')}</label>
                <MedicationAutocomplete
                    value={tempMed}
                    onChange={setTempMed}
                    placeholder={t('search_medication')}
                    onSelectMedication={handleSelectMedication}
                />
            </div>

            {/* Dose */}
            <div className="prescription-modal__field-wrapper">
                <label className="prescription-modal__label">
                    {t('dose')}
                    <Tooltip text={t('dose_help')} />
                </label>
                <Input
                    size="sm"
                    placeholder="500mg"
                    value={tempDose}
                    onChange={e => setTempDose(e.target.value)}
                />
            </div>

            {/* Frequency presets */}
            <div className="prescription-modal__field-wrapper">
                <label className="prescription-modal__label">
                    {t('frequency')}
                    <Tooltip text={t('frequency_help')} />
                </label>
                <div className="prescription-modal__freq-presets">
                    {freqPresets.map((p, idx) => (
                        <Button
                            key={idx}
                            type="button"
                            variant={tempFreqPreset === idx ? 'accent' : 'ghost'}
                            className={`prescription-modal__freq-btn${tempFreqPreset === idx ? ' prescription-modal__freq-btn--active' : ''}`}
                            onClick={() => handleFreqPreset(idx)}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Numeric fields row */}
            <div className="prescription-modal__numeric-row">
                <div className="prescription-modal__numeric-field">
                    <label className="prescription-modal__label">
                        {t('units_per_box')}
                    </label>
                    <Select
                        size="sm"
                        className="prescription-form-fields__select"
                        value={tempUnitsPerBox}
                        options={unitsPerBoxOptions}
                        onChange={e => setTempUnitsPerBox(e.target.value)}
                    />
                </div>

                <div className="prescription-modal__numeric-field">
                    <label className="prescription-modal__label">
                        {t('daily_units')}
                    </label>
                    <Select
                        size="sm"
                        className="prescription-form-fields__select"
                        value={tempDailyUnits}
                        options={dailyUnitsOptions}
                        onChange={e => setTempDailyUnits(e.target.value)}
                    />
                </div>

                <div className="prescription-modal__numeric-field">
                    <label className="prescription-modal__label">
                        {t('boxes')}
                        <Tooltip text={t('boxes_help')} />
                    </label>
                    <Input
                        size="sm"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={tempBoxes}
                        onChange={e => setTempBoxes(e.target.value)}
                    />
                </div>

                {/* Add button */}
                <div className="prescription-modal__add-col">
                    <label className="prescription-modal__label">&nbsp;</label>
                    <Button
                        type="button"
                        onClick={handleAddItem}
                        icon={<Icon name="add" />}
                        disabled={!canAdd}
                    >
                        {t('add')}
                    </Button>
                </div>
            </div>

            {/* Days supply preview */}
            {daysSupply !== null && (
                <div className="prescription-modal__supply-preview">
                    <Icon name="notifications" size="1rem" />
                    <span>
                        {t('supply_prefix')} <strong>~{daysSupply} {t('days')}</strong>
                        {refillDateStr && (
                            <> · {t('automatic_reminder')}: <strong>{refillDateStr}</strong></>
                        )}
                    </span>
                </div>
            )}
        </div>
    );
};

export default PrescriptionFormFields;

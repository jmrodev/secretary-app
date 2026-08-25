import React from 'react';
import { MedicationAutocomplete } from '@/features/medical_documents/components/ui/MedicationAutocomplete';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Tooltip } from '@/components/atoms/Tooltip';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';


/**
 * MedicationInputSection Feature Molecule.
 * Orchestrates the search, dosage, and frequency fields for adding medications.
 * The primary interface for data entry in the medical_documents prescription workflow.
 */
export const MedicationInputSection = ({
    tempMed, setTempMed,
    tempDose, setTempDose,
    tempFreqPreset, setTempFreqPreset,
    setTempFreq,
    tempDailyUnits, setTempDailyUnits,
    tempUnitsPerBox, setTempUnitsPerBox,
    tempQty, setTempQty,
    daysSupply, refillDateStr,
    onAddItem, onVademecumSelect,
    freqPresets, baseClass, t
}) => {
    const compClass = 'medication-input-section';

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
        <div className={`${baseClass ? `${baseClass}__med-input-row` : ''} ${compClass}__med-input-row animate-fade-in`}>
            <div className={`${baseClass ? `${baseClass}__inputs-grid` : ''} ${compClass}__inputs-grid`}>
                <div className={`${baseClass ? `${baseClass}__field-wrapper` : ''} ${compClass}__field-wrapper`}>
                    <label htmlFor="med-input-search" className={`${baseClass ? `${baseClass}__field-label` : ''} ${compClass}__field-label`}>
                        {t('medication')}
                    </label>
                    <MedicationAutocomplete
                        id="med-input-search"
                        value={tempMed}
                        onChange={setTempMed}
                        onSelectMedication={onVademecumSelect}
                        placeholder={t('medication_placeholder') || "Nombre del medicamento..."}
                    />
                </div>

                <div className={`${baseClass ? `${baseClass}__field-group-row` : ''} ${compClass}__field-group-row`}>
                    <div className={`${baseClass ? `${baseClass}__field-wrapper` : ''} ${compClass}__field-wrapper`}>
                        <label htmlFor="med-input-dose" className={`${baseClass ? `${baseClass}__field-label` : ''} ${compClass}__field-label`}>
                            {t('dose')}
                            <Tooltip text={t('dose_help') || "Concentración (ej: 500mg, 10mg/ml)"} />
                        </label>
                        <Input
                            id="med-input-dose"
                            size="sm"
                            placeholder={t('dose_placeholder') || "Dosis (ej: 500mg)"}
                            value={tempDose}
                            onChange={e => setTempDose(e.target.value)}
                        />
                    </div>

                    <div className={`${baseClass ? `${baseClass}__field-wrapper` : ''} ${compClass}__field-wrapper`}>
                        <span className={`${baseClass ? `${baseClass}__field-label` : ''} ${compClass}__field-label`}>
                            {t('frequency')}
                            <Tooltip text={t('freq_help') || "Selecciona o escribe la frecuencia"} />
                        </span>
                        <div className={`${baseClass ? `${baseClass}__freq-presets` : ''} ${compClass}__freq-presets`}>
                            {freqPresets.map((p, idx) => (
                                <Button
                                    key={p.label}
                                    variant="ghost"
                                    active={tempFreqPreset === idx}
                                    className={`${baseClass ? `${baseClass}__freq-btn` : ''} ${compClass}__freq-btn`}
                                    onClick={() => {
                                        setTempFreqPreset(idx);
                                        setTempFreq(p.text);
                                        if (p.unitsPerDay !== null) setTempDailyUnits(String(p.unitsPerDay));
                                    }}
                                    unstyled
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`${baseClass ? `${baseClass}__field-group-row` : ''} ${compClass}__field-group-row ${compClass}__field-group-row--numeric`}>
                    <div className={`${baseClass ? `${baseClass}__field-wrapper` : ''} ${compClass}__field-wrapper`}>
                        <label htmlFor="med-input-units-per-box" className={`${baseClass ? `${baseClass}__field-label` : ''} ${compClass}__field-label`}>
                            {t('units_per_box')}
                        </label>
                        <Select
                            id="med-input-units-per-box"
                            size="sm"
                            value={tempUnitsPerBox}
                            options={unitsPerBoxOptions}
                            onChange={e => setTempUnitsPerBox(e.target.value)}
                            className={`${baseClass ? `${baseClass}__select` : ''} ${compClass}__select`}
                        />
                    </div>

                    <div className={`${baseClass ? `${baseClass}__field-wrapper` : ''} ${compClass}__field-wrapper`}>
                        <label htmlFor="med-input-daily-units" className={`${baseClass ? `${baseClass}__field-label` : ''} ${compClass}__field-label`}>
                            {t('daily_units')}
                        </label>
                        <Select
                            id="med-input-daily-units"
                            size="sm"
                            value={tempDailyUnits}
                            options={dailyUnitsOptions}
                            className={`${baseClass ? `${baseClass}__select` : ''} ${compClass}__select`}
                            onChange={e => {
                                const val = e.target.value;
                                setTempDailyUnits(val);
                                setTempFreqPreset(null);
                                if (val) {
                                    const num = parseFloat(val);
                                    let fStr = `${val} por día`;
                                    if (num === 1) fStr = 'cada 24hs';
                                    else if (num === 2) fStr = 'cada 12hs';
                                    else if (num === 3) fStr = 'cada 8hs';
                                    else if (num === 4) fStr = 'cada 6hs';
                                    else if (num === 0.5) fStr = 'día por medio';
                                    setTempFreq(fStr);
                                }
                            }}
                        />
                    </div>

                    <div className={`${baseClass ? `${baseClass}__field-wrapper` : ''} ${compClass}__field-wrapper`}>
                        <label htmlFor="med-input-quantity" className={`${baseClass ? `${baseClass}__field-label` : ''} ${compClass}__field-label`}>
                            {t('quantity')}
                        </label>
                        <Input
                            id="med-input-quantity"
                            size="sm"
                            type="number"
                            min="1"
                            placeholder="1"
                            value={tempQty}
                            onChange={e => setTempQty(e.target.value)}
                        />
                    </div>
                </div>

                {daysSupply !== null && (
                    <div className={`${baseClass ? `${baseClass}__supply-preview` : ''} ${compClass}__supply-preview animate-fade-in`}>
                        <Icon name="notifications" size="1.1rem" color="var(--accent-color)" />
                        <div className={`${baseClass ? `${baseClass}__supply-text` : ''} ${compClass}__supply-text`}>
                            {t('supply_prefix')} <strong className={compClass + '__text-accent'}>~{daysSupply} {t('days')}</strong>
                            {refillDateStr && (
                                <span className={`${baseClass ? `${baseClass}__refill-date` : ''} ${compClass}__refill-date`}>
                                    {' '}· {t('automatic_reminder')}: <strong>{refillDateStr}</strong>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <Button
                type="button"
                variant="primary"
                onClick={onAddItem}
                icon={<Icon name="add" size="1.2rem" />}
                className={compClass + "__add-btn"}
            />
        </div>
    );
};


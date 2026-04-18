import React from 'react';
import MedicationAutocomplete from './MedicationAutocomplete';
import Input from '@/components/atoms/Input';
import Tooltip from '@/components/atoms/Tooltip';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

/**
 * MedicationInputSection Feature Molecule.
 * Orchestrates the search, dosage, and frequency fields for adding medications.
 * The primary interface for data entry in the medical_documents prescription workflow.
 */
const MedicationInputSection = ({
    tempMed, setTempMed,
    tempDose, setTempDose,
    tempFreqPreset, setTempFreqPreset,
    tempFreq, setTempFreq,
    tempDailyUnits, setTempDailyUnits,
    tempUnitsPerBox, setTempUnitsPerBox,
    tempQty, setTempQty,
    daysSupply, refillDateStr,
    onAddItem, onVademecumSelect,
    freqPresets, baseClass, t
}) => {
    return (
        <div className={`${baseClass}__med-input-row animate-fadeIn`}>
            <div className={`${baseClass}__inputs-grid`}>
                <div className={`${baseClass}__field-wrapper`}>
                    <label className={`${baseClass}__field-label`}>
                        {t('medication')}
                    </label>
                    <MedicationAutocomplete
                        value={tempMed}
                        onChange={setTempMed}
                        onSelectMedication={onVademecumSelect}
                        placeholder={t('medication_placeholder') || "Nombre del medicamento..."}
                    />
                </div>

                <div className={`${baseClass}__field-group-row`}>
                    <div className={`${baseClass}__field-wrapper`}>
                        <label className={`${baseClass}__field-label`}>
                            {t('dose')}
                            <Tooltip text={t('dose_help') || "Concentración (ej: 500mg, 10mg/ml)"} />
                        </label>
                        <Input
                            size="sm"
                            placeholder={t('dose_placeholder') || "Dosis (ej: 500mg)"}
                            value={tempDose}
                            onChange={e => setTempDose(e.target.value)}
                        />
                    </div>

                    <div className={`${baseClass}__field-wrapper`}>
                        <label className={`${baseClass}__field-label`}>
                            {t('frequency')}
                            <Tooltip text={t('freq_help') || "Selecciona o escribe la frecuencia"} />
                        </label>
                        <div className={`${baseClass}__freq-presets`}>
                            {freqPresets.map((p, idx) => (
                                <Button
                                    key={idx}
                                    type="button"
                                    className={`${baseClass}__freq-btn ${tempFreqPreset === idx ? `${baseClass}__freq-btn--active` : ''}`}
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

                <div className={`${baseClass}__field-group-row ${baseClass}__field-group-row--numeric`}>
                    <div className={`${baseClass}__field-wrapper`}>
                        <label className={`${baseClass}__field-label`}>
                            {t('units_per_box') || 'Caja de (X) pastillas'}
                        </label>
                        <select
                            className={`input input--sm ${baseClass}__select`}
                            style={{ 
                                width: '100%', 
                                padding: '0.4rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.875rem'
                            }}
                            value={tempUnitsPerBox}
                            onChange={e => setTempUnitsPerBox(e.target.value)}
                        >
                            <option value="">{t('select_option') || 'Sel.'}</option>
                            {[10, 14, 20, 28, 30, 40, 50, 60, 100].map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div className={`${baseClass}__field-wrapper`}>
                        <label className={`${baseClass}__field-label`}>
                            {t('daily_units') || 'Pastillas por día'}
                        </label>
                        <select
                            className={`input input--sm ${baseClass}__select`}
                            style={{ 
                                width: '100%',
                                padding: '0.4rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.875rem'
                            }}
                            value={tempDailyUnits}
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
                        >
                            <option value="">{t('select_option') || 'Sel.'}</option>
                            {[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].map(v => (
                                <option key={v} value={v}>
                                    {v === 0.25 ? '1/4' : v === 0.5 ? '1/2' : v === 0.75 ? '3/4' : v}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={`${baseClass}__field-wrapper`}>
                        <label className={`${baseClass}__field-label`}>
                            {t('quantity') || 'Cantidad de cajas'}
                        </label>
                        <Input
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
                    <div className={`${baseClass}__supply-preview animate-fadeIn`}>
                        <Icon name="notifications" size="1.1rem" color="var(--accent-color)" />
                        <div className={`${baseClass}__supply-text`}>
                            {t('supply_prefix') || 'Abastece'} <strong className="text-accent">~{daysSupply} {t('days') || 'días'}</strong>
                            {refillDateStr && (
                                <span className={`${baseClass}__refill-date`}>
                                    {' '}· {t('automatic_reminder') || 'Sugerido'}: <strong>{refillDateStr}</strong>
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
                className="self-end mb-[2px]"
            />
        </div>
    );
};

export default MedicationInputSection;

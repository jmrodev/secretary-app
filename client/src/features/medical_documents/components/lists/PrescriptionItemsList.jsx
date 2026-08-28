
import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { MedicationAutocomplete } from '@/features/medical_documents/components/ui/MedicationAutocomplete';
import styles from './PrescriptionItemsList.module.css';

/**
 * PrescriptionItemsList Molecule.
 * Displays the current medications added to the batch prescription.
 */
export const PrescriptionItemsList = ({
    items, handleRemoveItem, t, readOnly: _readOnly,
    tempMed, setTempMed,
    tempDose, setTempDose,
    tempFreqPreset, handleFreqPreset,
    tempUnitsPerBox, setTempUnitsPerBox: _setTempUnitsPerBox,
    tempDailyUnits: _tempDailyUnits, setTempDailyUnits: _setTempDailyUnits,
    tempBoxes, setTempBoxes: _setTempBoxes,
    tempDays, handleQuantityChange,
    handleAddItem, handleSelectMedication,
    canAdd, daysSupply: _daysSupply, refillDateStr: _refillDateStr, freqPresets
}) => {
    const frequencyOptions = freqPresets
        ? freqPresets.map((p, idx) => {
              const safeKey = p.label
                  .replace('½', 'half')
                  .replace('¼', 'quarter')
                  .replace('¾', 'three_quarters')
                  .replace('/', '_per_')
                  .replace(' ', '_')
                  .toLowerCase();
              const translationKey = `freq_${safeKey}`;
              const labelText =
                  t(translationKey) === translationKey
                      ? p.text.charAt(0).toUpperCase() + p.text.slice(1)
                      : t(translationKey);
              return { value: idx, label: labelText };
          })
        : [];

    const unitsPerBoxOptions = [
        { value: '', label: '-' },
        ...[10, 14, 20, 28, 30, 40, 50, 60, 100].map((v) => ({ value: v, label: String(v) }))
    ];

    const boxesOptions = [
        { value: '', label: '-' },
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => ({ value: v, label: String(v) }))
    ];

    return (
        <div className={styles.PrescriptionItemsList__container}>
            <div className={`${styles.PrescriptionItemsList__tableWrapper} ${styles.PrescriptionItemsList__tableWrapperVisible}`}>
                <table className={styles.PrescriptionItemsList__table}>
                    <thead>
                        <tr>
                            <th className={styles.PrescriptionItemsList__thMed}>{t('medication')}</th>
                            <th className={styles.PrescriptionItemsList__thDose}>{t('dose')}</th>
                            <th className={styles.PrescriptionItemsList__thCol15}>{t('frequency')}</th>
                            <th className={styles.PrescriptionItemsList__thCol15}>{t('units_per_box_short')}</th>
                            <th className={styles.PrescriptionItemsList__thCol15}>{t('boxes')}</th>
                            <th className={styles.PrescriptionItemsList__thCol15}>{t('duration')}</th>
                            <th className={styles.PrescriptionItemsList__actionsCol}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Inline Form Row */}
                        {!_readOnly && (
                            <tr className={styles.PrescriptionItemsList__formRow}>
                                <td className={styles.PrescriptionItemsList__formCell}>
                                    <MedicationAutocomplete
                                        value={tempMed}
                                        onChange={setTempMed}
                                        placeholder={t('search_medication')}
                                        onSelectMedication={handleSelectMedication}
                                    />
                                </td>
                                <td className={styles.PrescriptionItemsList__formCell}>
                                    <Input
                                        placeholder={t('dose_placeholder')}
                                        value={tempDose}
                                        onChange={e => setTempDose(e.target.value)}
                                        className={styles.PrescriptionItemsList__controlSm}
                                    />
                                </td>
                                <td className={styles.PrescriptionItemsList__formCell}>
                                    <Select
                                        options={frequencyOptions}
                                        value={tempFreqPreset !== null ? tempFreqPreset : ''}
                                        onChange={(e) => handleFreqPreset(e.target.value !== '' ? Number(e.target.value) : null)}
                                        placeholder={`${t('frequency')}…`}
                                        size="sm"
                                        className={styles.PrescriptionItemsList__controlSm}
                                        ariaLabel={t('frequency')}
                                    />
                                </td>
                                <td className={styles.PrescriptionItemsList__formCell}>
                                    <Select
                                        options={unitsPerBoxOptions}
                                        value={tempUnitsPerBox}
                                        onChange={e => handleQuantityChange('units_per_box', e.target.value)}
                                        size="sm"
                                        className={`${styles.PrescriptionItemsList__controlSm} ${styles.PrescriptionItemsList__formSelectUnits}`}
                                        ariaLabel={t('units_per_box')}
                                    />
                                </td>
                                <td className={styles.PrescriptionItemsList__formCell}>
                                    <div className={`${styles.PrescriptionItemsList__qtyInputs} ${styles.PrescriptionItemsList__qtyInputsRow}`}>
                                        <Select
                                            options={boxesOptions}
                                            value={tempBoxes}
                                            onChange={e => handleQuantityChange('boxes', e.target.value)}
                                            size="sm"
                                            className={`${styles.PrescriptionItemsList__controlSm} ${styles.PrescriptionItemsList__formSelectBoxes}`}
                                            ariaLabel={t('boxes_quantity')}
                                        />
                                    </div>
                                </td>
                                <td className={`${styles.PrescriptionItemsList__formCell} ${styles.PrescriptionItemsList__cellCenter}`}>
                                    <div className={styles.PrescriptionItemsList__daysInputsRow}>
                                        <Input
                                            value={tempDays}
                                            onChange={e => handleQuantityChange('days', e.target.value)}
                                            placeholder="-"
                                            size="sm"
                                            className={styles.PrescriptionItemsList__inputDays}
                                        />
                                        <span className={styles.PrescriptionItemsList__daysLabel}>{t('days')}</span>
                                    </div>
                                </td>
                                <td className={styles.PrescriptionItemsList__actionsCol}>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={handleAddItem}
                                        disabled={!canAdd}
                                        size="sm"
                                        icon={<Icon name="ADD" />}
                                        className={styles.PrescriptionItemsList__controlSm}
                                    >
                                        {t('add')}
                                    </Button>
                                </td>
                            </tr>
                        )}

                        {/* Added Items */}
                        {items && items.map((item, idx) => (
                            <tr key={item._id || `item-${item.name}-${item.frequency || ''}`} className="animate-slide-in">
                                <td className={styles.PrescriptionItemsList__nameCell}>
                                    <span className={styles.PrescriptionItemsList__name}>{item.name}</span>
                                </td>
                                <td className={styles.PrescriptionItemsList__metaCell}>
                                    {item.dose && <span className={styles.PrescriptionItemsList__dose}>{item.dose}</span>}
                                </td>
                                <td className={styles.PrescriptionItemsList__metaCell}>
                                    <div className={styles.PrescriptionItemsList__metaItem}>
                                        <Icon name="schedule" size="0.9rem" />
                                        {item.frequency}
                                    </div>
                                </td>
                                <td className={styles.PrescriptionItemsList__metaCell}>
                                    {item.units_per_box ? `${item.units_per_box} u.` : '-'}
                                </td>
                                <td className={styles.PrescriptionItemsList__metaCell}>
                                    {item.quantity && item.quantity !== '0' && (
                                        <div className={styles.PrescriptionItemsList__metaItem}>
                                            <Icon name="inventory_2" size="0.9rem" />
                                            {item.quantity} {parseInt(item.quantity) === 1 ? (t('box')) : (t('boxes_plural'))}
                                        </div>
                                    )}
                                </td>
                                <td className={`${styles.PrescriptionItemsList__metaCell} ${styles.PrescriptionItemsList__cellCenter}`}>
                                    {item.days_supply && (
                                        <div className={`${styles.PrescriptionItemsList__metaItem} ${styles.PrescriptionItemsList__daysSupply} ${styles.PrescriptionItemsList__metaItemCenter}`}>
                                            ~{item.days_supply} {t('days')}
                                        </div>
                                    )}
                                </td>
                                <td className={styles.PrescriptionItemsList__actionsCol}>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleRemoveItem(idx)}
                                        icon={<Icon name="close" size="1.2rem" />}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


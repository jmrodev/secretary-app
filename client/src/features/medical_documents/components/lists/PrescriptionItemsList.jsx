
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import inputStyles from '@/components/atoms/Input.module.css';
import MedicationAutocomplete from '@/features/medical_documents/components/ui/MedicationAutocomplete';
import styles from './PrescriptionItemsList.module.css';

/**
 * PrescriptionItemsList Molecule.
 * Displays the current medications added to the batch prescription.
 */
const PrescriptionItemsList = ({
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
    return (
        <div className={styles.container}>
            <div className={styles.tableWrapper} style={{ overflow: 'visible' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '32%' }}>Medicamento</th>
                            <th style={{ width: '8%' }}>Dosis</th>
                            <th style={{ width: '15%' }}>Frecuencia</th>
                            <th style={{ width: '15%' }}>Cant/Caja</th>
                            <th style={{ width: '15%' }}>Envases</th>
                            <th style={{ width: '15%' }}>Duración</th>
                            <th className={styles.actionsCol}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Inline Form Row */}
                        <tr className={styles.formRow}>
                            <td className={styles.formCell}>
                                <MedicationAutocomplete
                                    value={tempMed}
                                    onChange={setTempMed}
                                    placeholder={t('search_medication') || 'Buscar medicamento...'}
                                    onSelectMedication={handleSelectMedication}
                                />
                            </td>
                            <td className={styles.formCell}>
                                <Input
                                    placeholder={t('dose_placeholder') || 'Dosis'}
                                    value={tempDose}
                                    onChange={e => setTempDose(e.target.value)}
                                    style={{ padding: '0.25rem 0.5rem', minHeight: '30px' }}
                                />
                            </td>
                            <td className={styles.formCell}>
                                <select
                                    className={`${inputStyles.root} ${inputStyles.sm}`}
                                    style={{ padding: '0.25rem 0.5rem', minHeight: '30px' }}
                                    value={tempFreqPreset !== null ? tempFreqPreset : ''}
                                    onChange={(e) => handleFreqPreset(e.target.value !== '' ? Number(e.target.value) : null)}
                                >
                                    <option value="" disabled style={{ color: 'black' }}>Frecuencia…</option>
                                    {freqPresets && freqPresets.map((p, idx) => {
                                        const safeKey = p.label.replace('½', 'half').replace('¼', 'quarter').replace('¾', 'three_quarters').replace('/', '_per_').replace(' ', '_').toLowerCase();
                                        const translationKey = `freq_${safeKey}`;
                                        const labelText = t(translationKey) === translationKey ? (p.text.charAt(0).toUpperCase() + p.text.slice(1)) : t(translationKey);
                                        return <option key={idx} value={idx} style={{ color: 'black' }}>{labelText}</option>;
                                    })}
                                </select>
                            </td>
                            <td className={styles.formCell}>
                                <select
                                    className={`${inputStyles.root} ${inputStyles.sm}`}
                                    style={{ padding: '0.25rem 0.5rem', minHeight: '30px', width: '100%', textAlign: 'center' }}
                                    value={tempUnitsPerBox}
                                    onChange={e => handleQuantityChange('units_per_box', e.target.value)}
                                >
                                    <option value="" style={{ color: 'black' }}>-</option>
                                    {[10, 14, 20, 28, 30, 40, 50, 60, 100].map(v => (
                                        <option key={v} value={v} style={{ color: 'black' }}>{v}</option>
                                    ))}
                                </select>
                            </td>
                            <td className={styles.formCell}>
                                <div className={styles.qtyInputs} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                                    <select
                                        className={`${inputStyles.root} ${inputStyles.sm}`}
                                        style={{ padding: '0.25rem 0.5rem', minHeight: '30px', width: '55px', textAlign: 'center' }}
                                        value={tempBoxes}
                                        onChange={e => handleQuantityChange('boxes', e.target.value)}
                                        title="Cantidad de envases"
                                    >
                                        <option value="" style={{ color: 'black' }}>-</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                                            <option key={v} value={v} style={{ color: 'black' }}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </td>
                            <td className={styles.formCell} style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center', flexWrap: 'nowrap' }}>
                                    <Input
                                        value={tempDays}
                                        onChange={e => handleQuantityChange('days', e.target.value)}
                                        placeholder="-"
                                        size="sm"
                                        style={{ width: '55px', textAlign: 'center', padding: '0.25rem' }}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'rgb(255 255 255 / 50%)', whiteSpace: 'nowrap' }}>días</span>
                                </div>
                            </td>
                            <td className={styles.actionsCol}>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleAddItem}
                                    disabled={!canAdd}
                                    size="sm"
                                    icon={<Icon name="ADD" />}
                                    style={{ padding: '0.25rem 0.5rem', minHeight: '30px' }}
                                >
                                    {t('add') || 'Añadir'}
                                </Button>
                            </td>
                        </tr>

                        {/* Added Items */}
                        {items && items.map((item, idx) => (
                            <tr key={item._id || idx} className="animate-slide-in">
                                <td className={styles.nameCell}>
                                    <span className={styles.name}>{item.name}</span>
                                </td>
                                <td className={styles.metaCell}>
                                    {item.dose && <span className={styles.dose}>{item.dose}</span>}
                                </td>
                                <td className={styles.metaCell}>
                                    <div className={styles.metaItem}>
                                        <Icon name="schedule" size="0.9rem" />
                                        {item.frequency}
                                    </div>
                                </td>
                                <td className={styles.metaCell}>
                                    {item.units_per_box ? `${item.units_per_box} u.` : '-'}
                                </td>
                                <td className={styles.metaCell}>
                                    {item.quantity && item.quantity !== '0' && (
                                        <div className={styles.metaItem}>
                                            <Icon name="inventory_2" size="0.9rem" />
                                            {item.quantity} {parseInt(item.quantity) === 1 ? (t('box') || 'caja') : (t('boxes_plural') || 'cajas')}
                                        </div>
                                    )}
                                </td>
                                <td className={styles.metaCell} style={{ textAlign: 'center' }}>
                                    {item.days_supply && (
                                        <div className={`${styles.metaItem} ${styles.daysSupply}`} style={{ justifyContent: 'center' }}>
                                            ~{item.days_supply} {t('days') || 'días'}
                                        </div>
                                    )}
                                </td>
                                <td className={styles.actionsCol}>
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

export default PrescriptionItemsList;

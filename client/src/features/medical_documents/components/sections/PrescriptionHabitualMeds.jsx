import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './PrescriptionHabitualMeds.module.css';

const QuickSelectTable = ({ meds, label, items, onSelect, t }) => {
    if (!meds || meds.length === 0) return null;
    return (
        <div className={styles.container}>
            <label className={styles.label}>{label}</label>
            <div className={styles.tableWrapper}>
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
                        {meds.map((m) => {
                            const name = m.medication_name || m.name;
                            const isSelected = items.some(i => i.name === name);
                            return (
                                <tr key={m.id || name} className={isSelected ? styles.rowSelected : ''}>
                                    <td className={styles.nameCell}>{name}</td>
                                    <td className={styles.metaCell}>{m.dose || '-'}</td>
                                    <td className={styles.metaCell}>
                                        {m.frequency ? (
                                            <div className={styles.metaItem}>
                                                <Icon name="schedule" size="0.9rem" />
                                                {m.frequency}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className={styles.metaCell}>
                                        {m.units_per_box ? `${m.units_per_box} u.` : '-'}
                                    </td>
                                    <td className={styles.metaCell}>
                                        {(m.boxes_count || m.quantity) && (m.boxes_count || m.quantity) !== '0' ? (
                                            <div className={styles.metaItem}>
                                                <Icon name="inventory_2" size="0.9rem" />
                                                {m.boxes_count || m.quantity} {parseInt(m.boxes_count || m.quantity) === 1 ? (t('box') || 'caja') : (t('boxes_plural') || 'cajas')}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className={styles.metaCell} style={{ textAlign: 'center' }}>
                                        {m.days_supply ? (
                                            <div className={`${styles.metaItem} ${styles.daysSupply}`} style={{ justifyContent: 'center' }}>
                                                ~{m.days_supply} {t('days') || 'días'}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className={styles.actionsCol}>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={isSelected ? 'success' : 'secondary'}
                                            onClick={() => onSelect(m)}
                                            className={styles.actionBtn}
                                        >
                                            {isSelected ? (t('selected') || 'En lista') : (t('load') || 'Cargar')}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const EMPTY_ARRAY = [];

const PrescriptionHabitualMeds = ({ patientMeds, historyMeds = EMPTY_ARRAY, items, handleSelectMedication, t }) => {
    const hasHabitual = patientMeds && patientMeds.length > 0;
    const hasHistory = historyMeds && historyMeds.length > 0;

    if (!hasHabitual && !hasHistory) return null;

    return (
        <div className={styles.wrapper}>
            <QuickSelectTable
                meds={patientMeds}
                label={t('habitual_meds') || 'Habituales'}
                items={items}
                onSelect={handleSelectMedication}
                t={t}
            />
            <QuickSelectTable
                meds={historyMeds}
                label={t('recent_history') || 'Histórico'}
                items={items}
                onSelect={handleSelectMedication}
                t={t}
            />
        </div>
    );
};

export default PrescriptionHabitualMeds;

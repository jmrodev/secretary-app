import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './PrescriptionHabitualMeds.module.css';

const QuickSelectTable = ({ meds, label, items, onSelect, t }) => {
    if (!meds || meds.length === 0) return null;
    return (
        <div className={styles.PrescriptionHabitualMeds__container}>
            <span className={styles.PrescriptionHabitualMeds__label}>{label}</span>
            <div className={styles.PrescriptionHabitualMeds__tableWrapper}>
                <table className={styles.PrescriptionHabitualMeds__table}>
                    <thead>
                        <tr>
                            <th style={{ width: '32%' }}>{t('medication') || 'Medicamento'}</th>
                            <th style={{ width: '8%' }}>{t('dose') || 'Dosis'}</th>
                            <th style={{ width: '15%' }}>{t('frequency') || 'Frecuencia'}</th>
                            <th style={{ width: '15%' }}>{t('units_per_box_short') || 'Cant/Caja'}</th>
                            <th style={{ width: '15%' }}>{t('boxes') || 'Envases'}</th>
                            <th style={{ width: '15%' }}>{t('duration') || 'Duración'}</th>
                            <th className={styles.PrescriptionHabitualMeds__actionsCol}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {meds.map((m) => {
                            const name = m.medication_name || m.name;
                            const isSelected = items.some(i => i.name === name);
                            return (
                                <tr key={m.id || name} className={isSelected ? styles.PrescriptionHabitualMeds__rowSelected : ''}>
                                    <td className={styles.PrescriptionHabitualMeds__nameCell}>{name}</td>
                                    <td className={styles.PrescriptionHabitualMeds__metaCell}>{m.dose || '-'}</td>
                                    <td className={styles.PrescriptionHabitualMeds__metaCell}>
                                        {m.frequency ? (
                                            <div className={styles.PrescriptionHabitualMeds__metaItem}>
                                                <Icon name="schedule" size="0.9rem" />
                                                {m.frequency}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className={styles.PrescriptionHabitualMeds__metaCell}>
                                        {m.units_per_box ? `${m.units_per_box} u.` : '-'}
                                    </td>
                                    <td className={styles.PrescriptionHabitualMeds__metaCell}>
                                        {(m.boxes_count || m.quantity) && (m.boxes_count || m.quantity) !== '0' ? (
                                            <div className={styles.PrescriptionHabitualMeds__metaItem}>
                                                <Icon name="inventory_2" size="0.9rem" />
                                                {m.boxes_count || m.quantity} {parseInt(m.boxes_count || m.quantity) === 1 ? (t('box') || 'caja') : (t('boxes_plural') || 'cajas')}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className={styles.PrescriptionHabitualMeds__metaCell} style={{ textAlign: 'center' }}>
                                        {m.days_supply ? (
                                            <div className={`${styles.PrescriptionHabitualMeds__metaItem} ${styles.PrescriptionHabitualMeds__daysSupply}`} style={{ justifyContent: 'center' }}>
                                                ~{m.days_supply} {t('days') || 'días'}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className={styles.PrescriptionHabitualMeds__actionsCol}>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={isSelected ? 'success' : 'secondary'}
                                            onClick={() => onSelect(m)}
                                            className={styles.PrescriptionHabitualMeds__actionBtn}
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

export const PrescriptionHabitualMeds = ({ patientMeds, historyMeds = EMPTY_ARRAY, items, handleSelectMedication, t }) => {
    const hasHabitual = patientMeds && patientMeds.length > 0;
    const hasHistory = historyMeds && historyMeds.length > 0;

    if (!hasHabitual && !hasHistory) return null;

    return (
        <div className={styles.PrescriptionHabitualMeds__wrapper}>
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


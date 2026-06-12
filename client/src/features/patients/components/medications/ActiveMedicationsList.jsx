
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { formatDate, isDueSoon } from '@/utils/core/dateUtils';

// Local Styles
import styles from './ActiveMedicationsList.module.css';

/**
 * ActiveMedicationsList (Executor).
 * Renders the table of active/chronic medications for a patient.
 */
const ActiveMedicationsList = ({ medications, loading, t, onDiscontinue, onRemindRefill, settings: _settings, user: _user, patientName: _patientName }) => {
    if (loading) {
        return <div className={`${styles.loading}`}>Cargando…</div>;
    }

    if (!medications || medications.length === 0) {
        return (
            <div className={`${styles.emptyState}`}>
                <p>{t('no_current_medications') || 'No hay medicación habitual registrada.'}</p>
            </div>
        );
    }

    return (
        <div className={`${styles.historyContainer}`}>
            <table className={`${styles.table}`}>
                <thead className={`${styles.tableHeader}`}>
                    <tr>
                        <th>{t('medication')}</th>
                        <th>{t('dose')}</th>
                        <th>{t('frequency')}</th>
                        <th className={`${styles.tableHeaderRight}`}>{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {medications.map(med => {
                        const urgent = isDueSoon(med.next_refill_date);
                        return (
                            <tr key={med.id} className={`${styles.tableRow}`}>
                                <td className={`${styles.tableCell}`}>
                                    <div className={`${styles.medicationNameBox}`}>
                                        {med.medication_name}
                                        {med.is_chronic && (
                                            <span className={`${styles.statusBadge} ${styles.statusBadgeChronic}`}>
                                                {t('chronic') || 'CRÓNICO'}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`${styles.medicationSubtext}`}>
                                        {med.presentation} - {med.monodroga}
                                    </div>
                                    {med.next_refill_date && (
                                        <div 
                                            className={`${styles.refillInfo} ${urgent ? styles.refillInfoUrgent : ''}`}
                                            suppressHydrationWarning
                                        >
                                            <Icon name="today" size="0.8rem" />
                                            {t('next_refill_date')}: {formatDate(med.next_refill_date)}
                                            <span className={`${styles.modeBadge}`}>
                                                ({med.reminder_mode === 'calculation' ? t('by_calculation') || 'Cálculo' :
                                                    med.reminder_mode === 'fixed_day' ? `${t('day') || 'Día'} ${med.reminder_day}` :
                                                        t('fixed') || 'Fijo'})
                                            </span>
                                        </div>
                                    )}
                                </td>
                                <td className={`${styles.tableCell}`}>{med.dose}</td>
                                <td className={`${styles.tableCell}`}>{med.frequency}</td>
                                <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                                    <div className="config-flex config-flex--justify-end config-flex--gap-2">
                                        {med.next_refill_date && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                title={t('remind_refill') || 'Recordar Renovación'}
                                                onClick={() => onRemindRefill(med)}
                                                icon={<Icon name="chat" size="1.1rem" />}
                                            />
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            className={`${styles.hoverDanger}`}
                                            onClick={() => onDiscontinue(med.id)}
                                            title={t('discontinue')}
                                            icon={<Icon name="close" size="1.1rem" />}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ActiveMedicationsList;


import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { formatDate } from '@/utils/core/dateUtils';

// Local Styles
import './ActiveMedicationsList.css';

/**
 * ActiveMedicationsList (Executor).
 * Renders the table of active/chronic medications for a patient.
 */
const ActiveMedicationsList = ({ medications, loading, t, onDiscontinue, onRemindRefill, settings, user, patientName }) => {
    const [now, setNow] = React.useState(null);
    React.useEffect(() => {
        setNow(new Date());
    }, []);

    if (loading) {
        return <div className="patient-medications__loading">Cargando…</div>;
    }

    if (!medications || medications.length === 0) {
        return (
            <div className="patient-medications__empty-state">
                <p>{t('no_current_medications') || 'No hay medicación habitual registrada.'}</p>
            </div>
        );
    }

    const isUrgent = (refillDate) => {
        if (!now || !refillDate) return false;
        const refill = new Date(refillDate);
        const limit = new Date(now);
        limit.setDate(limit.getDate() + 2);
        return refill <= limit;
    };

    return (
        <div className="patient-medications__history-container">
            <table className="patient-medications__table">
                <thead className="patient-medications__table-header">
                    <tr>
                        <th>{t('medication')}</th>
                        <th>{t('dose')}</th>
                        <th>{t('frequency')}</th>
                        <th className="patient-medications__table-header--right">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {medications.map(med => (
                        <tr key={med.id} className="patient-medications__table-row">
                            <td className="patient-medications__table-cell">
                                <div className="patient-medications__medication-name-box">
                                    {med.medication_name}
                                    {med.is_chronic && (
                                        <span className="patient-medications__status-badge patient-medications__status-badge--chronic">
                                            {t('chronic') || 'CRÓNICO'}
                                        </span>
                                    )}
                                </div>
                                <div className="patient-medications__medication-subtext">
                                    {med.presentation} - {med.monodroga}
                                </div>
                                {med.next_refill_date && (
                                    <div className={`patient-medications__refill-info ${isUrgent(med.next_refill_date) ? 'patient-medications__refill-info--urgent' : ''}`}>
                                        <Icon name="today" size="0.8rem" />
                                        {t('next_refill_date')}: {formatDate(med.next_refill_date)}
                                        <span className="patient-medications__mode-badge">
                                            ({med.reminder_mode === 'calculation' ? t('by_calculation') || 'Cálculo' :
                                                med.reminder_mode === 'fixed_day' ? `${t('day') || 'Día'} ${med.reminder_day}` :
                                                    t('fixed') || 'Fijo'})
                                        </span>
                                    </div>
                                )}
                            </td>
                            <td className="patient-medications__table-cell">{med.dose}</td>
                            <td className="patient-medications__table-cell">{med.frequency}</td>
                            <td className="patient-medications__table-cell patient-medications__table-cell--right">
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
                                        className="hover-danger"
                                        onClick={() => onDiscontinue(med.id)}
                                        title={t('discontinue')}
                                        icon={<Icon name="close" size="1.1rem" />}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ActiveMedicationsList;

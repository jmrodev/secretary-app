import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { useLanguage } from '@/context/LanguageContext';
import { formatDate } from '@/utils/dateUtils';

/**
 * MedicationHistory (Executor).
 * Renders the clinical history of prescriptions for a specific patient.
 */
const MedicationHistory = ({ recentRequests, t, onRepeat }) => {
    return (
        <section className="details-block details-block--medications">
            <header className="details-block__header">
                <h3 className="details-block__title">
                    <Icon name="history" size="1.2rem" />
                    {t('recent_prescriptions')}
                </h3>
            </header>

            <div className="details-block__content">
                {recentRequests.length === 0 ? (
                    <div className="patient-medications__empty-state">
                        <Icon name="documents" size="2rem" />
                        <p>{t('no_history')}</p>
                    </div>
                ) : (
                    <div className="patient-medications__history-container">
                        <table className="patient-medications__table">
                            <thead className="patient-medications__table-header">
                                <tr>
                                    <th>{t('date')}</th>
                                    <th>{t('prescription_detail')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRequests.map(req => (
                                    <tr key={req.id} className="patient-medications__table-row">
                                        <td className="patient-medications__table-cell">
                                            <span className="patient-medications__date-badge">
                                                {formatDate(req.created_at)}
                                            </span>
                                            <div className="patient-medications__doctor-name">
                                                Dr/a. {req.doctor_name}
                                            </div>
                                        </td>
                                        <td className="patient-medications__table-cell">
                                            <div className="patient-medications__request-note">
                                                {req.request_note}
                                            </div>
                                        </td>
                                        <td className="patient-medications__table-cell">
                                            <span className={`patient-medications__status-tag status-${req.status === 'completed' ? 'completed' : 'pending'}`}>
                                                {req.status === 'completed' ? t('delivered') : t('pending')}
                                            </span>
                                        </td>
                                        <td className="patient-medications__table-cell">
                                            <Button
                                                variant="primary"
                                                size="sm-compact"
                                                title={t('repeat_prescription')}
                                                onClick={() => onRepeat && onRepeat(req)}
                                                icon={<Icon name="history" size="1.2rem" />}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
};

export default MedicationHistory;

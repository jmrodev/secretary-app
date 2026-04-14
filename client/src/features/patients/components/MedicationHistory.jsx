
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { formatDate } from '@/utils/dateUtils';
import './MedicationHistory.css';

/**
 * MedicationHistory Molecule.
 * Renders the clinical history of prescriptions for a specific patient.
 */
const MedicationHistory = ({ recentRequests, t, onRepeat }) => {
    return (
        <section className="medication-history">
            <header className="medication-history__header">
                <h3 className="medication-history__title">
                    <Icon name="history" />
                    {t('recent_prescriptions')}
                </h3>
            </header>

            <div className="medication-history__content">
                {recentRequests.length === 0 ? (
                    <div className="medication-history__empty">
                        <Icon name="documents" size="3rem" />
                        <p>{t('no_history')}</p>
                    </div>
                ) : (
                    <div className="medication-history__table-container">
                        <table className="medication-history__table">
                            <thead>
                                <tr>
                                    <th className="medication-history__th">{t('date')}</th>
                                    <th className="medication-history__th">{t('prescription_detail')}</th>
                                    <th className="medication-history__th">{t('status')}</th>
                                    <th className="medication-history__th"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRequests.map(req => (
                                    <tr key={req.id} className="medication-history__tr">
                                        <td className="medication-history__cell">
                                            <div className="medication-history__date-wrapper">
                                                <Badge variant="blue">
                                                    {formatDate(req.created_at)}
                                                </Badge>
                                                <span className="medication-history__doctor">
                                                    Dr. {req.doctor_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="medication-history__cell">
                                            <div className="medication-history__note">
                                                {req.request_note}
                                            </div>
                                        </td>
                                        <td className="medication-history__cell">
                                            <Badge variant={req.status === 'completed' ? 'success' : 'warning'}>
                                                {req.status === 'completed' ? t('delivered') : t('pending')}
                                            </Badge>
                                        </td>
                                        <td className="medication-history__cell medication-history__actions">
                                            <Button
                                                variant="secondary"
                                                size="sm-compact"
                                                onClick={() => onRepeat && onRepeat(req)}
                                                icon={<Icon name="history" />}
                                                title={t('repeat_prescription')}
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

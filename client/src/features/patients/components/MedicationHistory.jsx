
import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
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
                    <Icon name="HISTORY" size="1.2rem" />
                    {t('recent_prescriptions') || 'Historial de Recetas'}
                </h3>
            </header>

            <div className="details-block__content">
                {recentRequests.length === 0 ? (
                    <div className="patient-medications__empty-state">
                        <Icon name="DOCUMENTS" size="2rem" />
                        <p>{t('no_history') || 'No se han generado recetas para este paciente.'}</p>
                    </div>
                ) : (
                    <div className="patient-medications__history-container">
                        <table className="patient-medications__table">
                            <thead className="patient-medications__table-header">
                                <tr>
                                    <th>{t('date')}</th>
                                    <th>{t('prescription_detail')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('actions') || 'Acciones'}</th>
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
                                                {req.status === 'completed' ? t('delivered') || 'Entregado' : t('pending') || 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="patient-medications__table-cell">
                                            <Button
                                                className="btn-icon btn-icon--primary"
                                                title={t('repeat_prescription') || 'Repetir Receta'}
                                                onClick={() => onRepeat && onRepeat(req)}
                                                unstyled
                                            >
                                                <Icon name="HISTORY" size="1.2rem" />
                                            </Button>
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

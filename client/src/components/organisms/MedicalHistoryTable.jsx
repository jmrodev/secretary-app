import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/time';
import Button from '../atoms/Button';
import './MedicalHistoryTable.css';

const MedicalHistoryTable = ({ items, filterItem, onView, onDelete, icon, title, originLabel, canDelete }) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    const showDelete = canDelete !== undefined ? canDelete : (user.role === 'admin' || user.role === 'secretary');
    const filteredItems = items.filter(filterItem);

    return (
        <div className="medical-history">
            <h3 className="medical-history__title">
                <span>{icon}</span> {title}
            </h3>

            <div className="medical-history-container">
                <table className="medical-history-table">
                    <thead>
                        <tr>
                            <th className="medical-history-table__header-date">{t('date')}</th>
                            <th className="medical-history-table__header-patient">{t('patient')}</th>
                            <th className="medical-history-table__header-detail">{t('detail')}</th>
                            <th className="medical-history-table__header-doctor">{t('doctor')}</th>
                            <th className="medical-history-table__header-actions">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={`${item._origin}_${item.id}`} className="medical-history-table__row">
                                <td>
                                    <div className="medical-history-table__date-cell">
                                        <span className="medical-history-table__date">{new Date(item.appointment_date || item.created_at).toLocaleDateString()}</span>
                                        <span className="medical-history-table__time-ago">{timeAgo(item.appointment_date || item.created_at)}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="medical-history-table__patient-cell">
                                        <span className="medical-history-table__patient-name">{item.patient_name}</span>
                                        {item._origin === 'request' && (
                                            <span className="medical-history-table__origin-tag">
                                                {originLabel || t('request')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="medical-history-table__detail" title={item.medications || item.request_note || item.diagnosis || item.description}>
                                        {item.medications || item.request_note || item.diagnosis || item.description}
                                    </div>
                                </td>
                                <td>
                                    <div className="medical-history-table__doctor">Dr. {item.doctor_name}</div>
                                </td>
                                <td>
                                    <div className="medical-history-table__actions">
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => onView(item)}
                                            title={t('view')}
                                            icon="👁️"
                                        />
                                        {showDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => onView(item)}
                                                title={t('edit')}
                                                icon="✏️"
                                            />
                                        )}
                                        {showDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => onDelete(item.id, item)}
                                                title={t('delete')}
                                                icon="🗑️"
                                            />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredItems.length === 0 && (
                    <div className="medical-history-table__empty">
                        <p>{t('none_found')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalHistoryTable;

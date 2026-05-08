
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Pagination from '@/components/atoms/Pagination';
import { useAuth } from '@/features/auth';
import { timeAgo, formatDate } from '@/utils/dateUtils';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './MedicalHistoryTable.css';

const MedicalHistoryTable = ({ 
    items, 
    loading,
    onView, 
    onDelete, 
    icon, 
    title, 
    originLabel, 
    canDelete,
    currentPage,
    totalPages,
    onPageChange
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    const showDelete = canDelete !== undefined ? canDelete : (user?.role === 'admin' || user?.role === 'secretary');

    const safeItems = Array.isArray(items) ? items : [];

    return (
        <section className={`medical-history ${loading ? 'medical-history--loading' : 'animate-fadeIn'}`}>
            <header className="medical-history__title">
                <span className="medical-history__title-icon">
                    <Icon name={icon} size="1.2rem" />
                </span>
                <h2 className="medical-history__title-text">{title}</h2>
            </header>

            <div className="medical-history__wrapper">
                <table className="medical-history__table table-base">
                    <thead>
                        <tr>
                            <th className="medical-history__th medical-history__th--date">{t('date')}</th>
                            <th className="medical-history__th">{t('patient')}</th>
                            <th className="medical-history__th medical-history__th--detail">{t('detail')}</th>
                            <th className="medical-history__th">{t('doctor')}</th>
                            <th className="medical-history__th medical-history__th--actions">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeItems.map(item => (
                            <tr key={`${item._origin}_${item.id}`} className="medical-history__row">
                                <td className="medical-history__td">
                                    <div className="medical-history__date-cell">
                                        <span className="medical-history__date">{formatDate(item.appointment_date || item.created_at)}</span>
                                        <span className="medical-history__time-ago">{timeAgo(item.appointment_date || item.created_at)}</span>
                                    </div>
                                </td>
                                <td className="medical-history__td">
                                    <div className="medical-history__patient-cell">
                                        <span className="medical-history__patient-name">{item.patient_name}</span>
                                        {item._origin === 'request' && (
                                            <span
                                                className="medical-history__origin-tag medical-history__origin-tag--clickable"
                                                onClick={() => onView({ ...item, _readOnly: true })}
                                                title={t('view') || 'Ver'}
                                            >
                                                {originLabel || t('request')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="medical-history__td">
                                    <div className="medical-history__detail" title={item.medications || item.request_note || item.diagnosis || item.description}>
                                        {item.medications || item.request_note || item.diagnosis || item.description}
                                    </div>
                                </td>
                                <td className="medical-history__td">
                                    <div className="medical-history__doctor-name">Dr. {item.doctor_name}</div>
                                </td>
                                <td className="medical-history__td">
                                    <div className="medical-history__actions">
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => onView({ ...item, _readOnly: true })}
                                            title={t('view')}
                                            icon={<Icon name="visibility" size="1rem" />}
                                        />
                                        {showDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => onView(item)}
                                                title={t('edit')}
                                                icon={<Icon name="edit" size="1rem" />}
                                            />
                                        )}
                                        {showDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => onDelete(item.id, item)}
                                                title={t('delete')}
                                                icon={<Icon name="delete" size="1rem" />}
                                            />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {safeItems.length === 0 && (
                    <div className="medical-history__empty">
                        <p>{t('none_found')}</p>
                    </div>
                )}

                {totalPages > 1 && (
                    <footer className="medical-history__pagination">
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                            t={t}
                        />
                    </footer>
                )}
            </div>
        </section>
    );
};

export default MedicalHistoryTable;

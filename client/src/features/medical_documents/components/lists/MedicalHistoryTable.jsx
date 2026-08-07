
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Pagination from '@/components/atoms/Pagination';
import { useAuth } from '@/features/auth';
import { timeAgo, formatDate } from '@/utils/core/dateUtils';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './MedicalHistoryTable.module.css';

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
        <section className={`${styles.root} ${loading ? 'medical-history--loading' : 'animate-fade-in'}`}>
            <div className="medical-history__wrapper">
                <table className={`${styles.table} table-base`}>
                    <thead>
                        <tr>
                            <th className={`${styles.th} ${styles.thDate}`}>{t('date')}</th>
                            <th className={`${styles.th}`}>{t('patient')}</th>
                            <th className={`${styles.th} ${styles.thDetail}`}>{t('detail')}</th>
                            <th className={`${styles.th}`}>{t('doctor')}</th>
                            <th className={`${styles.th} ${styles.thActions}`}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeItems.map(item => (
                            <tr key={`${item._origin}_${item.id}`} className={`${styles.row}`}>
                                <td className={`${styles.td}`}>
                                    <div className={`${styles.dateCell}`}>
                                        <span className={`${styles.date}`}>{formatDate(item.appointment_date || item.created_at)}</span>
                                        <span className={`${styles.timeAgo}`}>{timeAgo(item.appointment_date || item.created_at)}</span>
                                    </div>
                                </td>
                                <td className={`${styles.td}`}>
                                    <div className={`${styles.patientCell}`}>
                                        <span className={`${styles.patientName}`}>{item.patient_name}</span>
                                        {item._origin === 'request' && (
                                            <span
                                                className={`${styles.originTag} ${styles.originTagClickable}`}
                                                onClick={() => onView({ ...item, _readOnly: true })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        onView({ ...item, _readOnly: true });
                                                    }
                                                }}
                                                title={t('view') || 'Ver'}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                {originLabel || t('request')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className={`${styles.td}`}>
                                    <div className={`${styles.detail}`} title={item.medications || item.request_note || item.diagnosis || item.description}>
                                        {item.medications || item.request_note || item.diagnosis || item.description}
                                    </div>
                                </td>
                                <td className={`${styles.td}`}>
                                    <div className={`${styles.doctorName}`}>Dr. {item.doctor_name}</div>
                                </td>
                                <td className={`${styles.td}`}>
                                    <div className={`${styles.actions}`}>
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
                    <div className={`${styles.empty}`}>
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

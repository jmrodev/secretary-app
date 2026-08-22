
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Pagination } from '@/components/atoms/Pagination';
import { useAuth } from '@/features/auth';
import { timeAgo, formatDate } from '@/utils/core/dateUtils';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './MedicalHistoryTable.module.css';

export const MedicalHistoryTable = ({ 
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
        <section className={`${styles.MedicalHistoryTable__root} ${loading ? 'medical-history--loading' : 'animate-fade-in'}`}>
            <div className="medical-history__wrapper">
                <table className={`${styles.MedicalHistoryTable__table} table-base`}>
                    <thead>
                        <tr>
                            <th className={`${styles.MedicalHistoryTable__th} ${styles.MedicalHistoryTable__thDate}`}>{t('date')}</th>
                            <th className={`${styles.MedicalHistoryTable__th}`}>{t('patient')}</th>
                            <th className={`${styles.MedicalHistoryTable__th} ${styles.MedicalHistoryTable__thDetail}`}>{t('detail')}</th>
                            <th className={`${styles.MedicalHistoryTable__th}`}>{t('doctor')}</th>
                            <th className={`${styles.MedicalHistoryTable__th} ${styles.MedicalHistoryTable__thActions}`}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeItems.map(item => (
                            <tr key={`${item._origin}_${item.id}`} className={`${styles.MedicalHistoryTable__row}`}>
                                <td className={`${styles.MedicalHistoryTable__td}`}>
                                    <div className={`${styles.MedicalHistoryTable__dateCell}`}>
                                        <span className={`${styles.MedicalHistoryTable__date}`}>{formatDate(item.appointment_date || item.created_at)}</span>
                                        <span className={`${styles.MedicalHistoryTable__timeAgo}`}>{timeAgo(item.appointment_date || item.created_at)}</span>
                                    </div>
                                </td>
                                <td className={`${styles.MedicalHistoryTable__td}`}>
                                    <div className={`${styles.MedicalHistoryTable__patientCell}`}>
                                        <span className={`${styles.MedicalHistoryTable__patientName}`}>{item.patient_name}</span>
                                        {item._origin === 'request' && (
                                            <span
                                                className={`${styles.MedicalHistoryTable__originTag} ${styles.MedicalHistoryTable__originTagClickable}`}
                                                onClick={() => onView({ ...item, _readOnly: true })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        onView({ ...item, _readOnly: true });
                                                    }
                                                }}
                                                title={t('view')}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                {originLabel || t('request')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className={`${styles.MedicalHistoryTable__td}`}>
                                    <div className={`${styles.MedicalHistoryTable__detail}`} title={item.medications || item.request_note || item.diagnosis || item.description}>
                                        {item.medications || item.request_note || item.diagnosis || item.description}
                                    </div>
                                </td>
                                <td className={`${styles.MedicalHistoryTable__td}`}>
                                    <div className={`${styles.MedicalHistoryTable__doctorName}`}>Dr. {item.doctor_name}</div>
                                </td>
                                <td className={`${styles.MedicalHistoryTable__td}`}>
                                    <div className={`${styles.MedicalHistoryTable__actions}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            className={`${styles.MedicalHistoryTable__actionBtn} ${styles.MedicalHistoryTable__actionBtnView}`}
                                            onClick={() => onView({ ...item, _readOnly: true })}
                                            title={t('view')}
                                            icon={<Icon name="visibility" size="1rem" />}
                                        />
                                        {showDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                className={`${styles.MedicalHistoryTable__actionBtn} ${styles.MedicalHistoryTable__actionBtnEdit}`}
                                                onClick={() => onView(item)}
                                                title={t('edit')}
                                                icon={<Icon name="edit" size="1rem" />}
                                            />
                                        )}
                                        {showDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                className={`${styles.MedicalHistoryTable__actionBtn} ${styles.MedicalHistoryTable__actionBtnDelete}`}
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
                    <div className={`${styles.MedicalHistoryTable__empty}`}>
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


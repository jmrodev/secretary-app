import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import { Loading } from '@/components/atoms/Loading';
import sharedStyles from '@/styles/shared.module.css';
import styles from './PatientRecycleBin.module.css';

const EMPTY_ARRAY = [];

/**
 * PatientRecycleBin (Executor).
 * Renders a list of deleted patients for restoration.
 */
const PatientRecycleBinBase = ({
    recycleItems = EMPTY_ARRAY,
    onRestore,
    loading
}) => {
    const { t } = useLanguage();

    if (loading) {
        return (
            <div className={`${styles.PatientRecycleBin__loading}`}>
                <Loading text={t('loading')} />
            </div>
        );
    }

    if (!recycleItems || recycleItems.length === 0) {
        return (
            <div className={`${styles.PatientRecycleBin__emptyState}`}>
                <div className={`${styles.PatientRecycleBin__emptyIcon}`}><Icon name="delete" size="2rem" /></div>
                <p className={`${styles.PatientRecycleBin__emptyTitle}`}>
                    {t('recycle_bin_empty')}
                </p>
                <p className={`${styles.PatientRecycleBin__emptyText}`}>
                    {t('recycle_bin_retention_hint')}
                </p>
            </div>
        );
    }

    return (
        <div className={`${styles.PatientRecycleBin__root} ${sharedStyles.AnimateFadeIn}`}>
            <div className={`${styles.PatientRecycleBin__container}`}>
                <table className={`${styles.PatientRecycleBin__table}`}>
                    <thead>
                        <tr>
                            <th className="w-1/3">{t('patient')}</th>
                            <th className="w-1/4">{t('contact_info')}</th>
                            <th className="w-1/4">{t('deleted_date')}</th>
                            <th className="w-1/6 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recycleItems.map((item) => (
                            <tr key={item.id} className={`${styles.PatientRecycleBin__row}`}>
                                <td>
                                    <div className={`${styles.PatientRecycleBin__patientWrapper}`}>
                                        <span className={`${styles.PatientRecycleBin__patientName}`}>
                                            {item.last_name && item.first_name
                                                ? `${item.last_name}, ${item.first_name}`
                                                : (item.entity_name || item.full_name || item.username || (t('no_name')))}
                                        </span>
                                        {item.dni && (
                                            <span className={`${styles.PatientRecycleBin__patientDni}`}>
                                                {t('dni')}: {item.dni}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className={`${styles.PatientRecycleBin__contactInfo}`}>
                                        {item.phone ? (
                                            <div className={`${styles.PatientRecycleBin__contactItem}`}>
                                                <span className="opacity-70"><Icon name="phone" size="1rem" /></span> {item.phone}
                                            </div>
                                        ) : (
                                            <span className={`${styles.PatientRecycleBin__contactMissing}`}>{t('no_phone_short')}</span>
                                        )}
                                        {item.email ? (
                                            <div className={`${styles.PatientRecycleBin__contactItem}`}>
                                                <span className="opacity-70"><Icon name="mail" size="1rem" /></span> {item.email}
                                            </div>
                                        ) : null}
                                    </div>
                                </td>
                                <td>
                                    <div className={`${styles.PatientRecycleBin__dateWrapper}`}>
                                        <span className={`${styles.PatientRecycleBin__date}`}>
                                            {formatDate(item.deleted_at || item.created_at)}
                                        </span>
                                        <span className={`${styles.PatientRecycleBin__time}`}>
                                            {formatTime(item.deleted_at || item.created_at)}
                                        </span>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <div className={`${styles.PatientRecycleBin__actions}`}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={`${styles.PatientRecycleBin__actionBtnRestore}`}
                                            onClick={() => onRestore && onRestore(item.id)}
                                            title={t('restore')}
                                            icon={<Icon name="restore" />}
                                        >
                                            {t('restore')}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={`${styles.PatientRecycleBin__footerHint}`}>
                <p><Icon name="warning" size="1rem" className="mr-1" />{t('permanent_delete_warning')}</p>
            </div>
        </div>
    );
};

export const PatientRecycleBin = React.memo(PatientRecycleBinBase);
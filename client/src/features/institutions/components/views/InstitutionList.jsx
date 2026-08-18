import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import styles from './InstitutionList.module.css';

export const InstitutionList = React.memo(({ institutions, onEdit, onDelete, t }) => {

    if (institutions.length === 0) {
        return (
            <div className={`${styles.InstitutionList__empty}`}>
                <Icon name="business" size="3rem" className={`${styles.InstitutionList__emptyIcon}`} />
                <p className={`${styles.InstitutionList__emptyText}`}>{t('no_institutions') || 'No hay instituciones registradas'}</p>
            </div>
        );
    }

    return (
        <div className="institution-list-container">
            <table className={`${styles.InstitutionList__table} table-base`}>
                <thead>
                    <tr>
                        <th className={`${styles.InstitutionList__th}`}>{t('name') || 'Nombre'}</th>
                        <th className={`${styles.InstitutionList__th}`}>{t('base_amount') || 'Monto Base'}</th>
                        <th className={`${styles.InstitutionList__th}`}>{t('pending_debt') || 'Deuda Pendiente'}</th>
                        <th className={`${styles.InstitutionList__th}`}>{t('status') || 'Estado'}</th>
                        <th className={`${styles.InstitutionList__th} ${styles.InstitutionList__thRight}`}>{t('actions') || 'Acciones'}</th>
                    </tr>
                </thead>
                <tbody>
                    {institutions.map(inst => (
                        <tr key={inst.id} className={`${styles.InstitutionList__row}`}>
                            <td className={`${styles.InstitutionList__td}`}>
                                <span className={`${styles.InstitutionList__name}`}>{inst.name}</span>
                            </td>
                            <td className={`${styles.InstitutionList__td}`}>
                                <span className={`${styles.InstitutionList__price}`}>${Number(inst.base_price || 0).toLocaleString()}</span>
                            </td>
                            <td className={`${styles.InstitutionList__td}`}>
                                <span className={`${styles.InstitutionList__debt}`}>${Number(inst.total_debt || 0).toLocaleString()}</span>
                            </td>
                            <td className={`${styles.InstitutionList__td}`}>
                                <Badge variant={inst.status === 'active' ? 'green' : 'red'}>
                                    {t(inst.status) || inst.status}
                                </Badge>
                            </td>
                            <td className={`${styles.InstitutionList__td}`}>
                                <div className={`${styles.InstitutionList__actions}`}>
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => onEdit(inst)}
                                        icon={<Icon name="edit" size="1.1rem" color="var(--blue-600)" />}
                                        title={t('edit')}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        className="btn--danger-ghost"
                                        onClick={() => onDelete(inst.id)}
                                        icon={<Icon name="delete" size="1.1rem" color="var(--red-500)" />}
                                        title={t('delete')}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

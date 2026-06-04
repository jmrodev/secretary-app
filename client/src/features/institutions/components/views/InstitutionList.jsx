import React from 'react';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import styles from './InstitutionList.module.css';

const InstitutionList = ({ institutions, onEdit, onDelete, t }) => {

    if (institutions.length === 0) {
        return (
            <div className={`${styles.empty}`}>
                <Icon name="business" size="3rem" className={`${styles.emptyIcon}`} />
                <p className={`${styles.emptyText}`}>{t('no_institutions') || 'No hay instituciones registradas'}</p>
            </div>
        );
    }

    return (
        <div className="institution-list-container">
            <table className={`${styles.table} table-base`}>
                <thead>
                    <tr>
                        <th className={`${styles.th}`}>{t('name') || 'Nombre'}</th>
                        <th className={`${styles.th}`}>{t('base_amount') || 'Monto Base'}</th>
                        <th className={`${styles.th}`}>{t('pending_debt') || 'Deuda Pendiente'}</th>
                        <th className={`${styles.th}`}>{t('status') || 'Estado'}</th>
                        <th className={`${styles.th} ${styles.thRight}`}>{t('actions') || 'Acciones'}</th>
                    </tr>
                </thead>
                <tbody>
                    {institutions.map(inst => (
                        <tr key={inst.id} className={`${styles.row}`}>
                            <td className={`${styles.td}`}>
                                <span className={`${styles.name}`}>{inst.name}</span>
                            </td>
                            <td className={`${styles.td}`}>
                                <span className={`${styles.price}`}>${Number(inst.base_price || 0).toLocaleString()}</span>
                            </td>
                            <td className={`${styles.td}`}>
                                <span className={`${styles.debt}`}>${Number(inst.total_debt || 0).toLocaleString()}</span>
                            </td>
                            <td className={`${styles.td}`}>
                                <Badge variant={inst.status === 'active' ? 'green' : 'red'}>
                                    {t(inst.status) || inst.status}
                                </Badge>
                            </td>
                            <td className={`${styles.td}`}>
                                <div className={`${styles.actions}`}>
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
};

export default React.memo(InstitutionList);

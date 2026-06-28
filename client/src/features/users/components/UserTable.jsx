import React from 'react';
import Badge from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './UserTable.module.css';

const UserTable = ({ users, onEdit, onReset, onDelete }) => {
    const { t } = useLanguage();

    return (
        <div className={`${styles.userTableWrapper}`}>
            <table className={`${styles.table}`}>
                <thead>
                    <tr className="user-table__header">
                        <th className={`${styles.headerCell}`}>{t('user_header')}</th>
                        <th className={`${styles.headerCell}`}>{t('role_header')}</th>
                        <th className={`${styles.headerCell}`}>{t('name_contact_header')}</th>
                        <th className={`${styles.headerCell}`}>{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className={`${styles.row}`}>
                            <td className={`${styles.cell}`}>
                                <div className={`${styles.username}`}>{u.username}</div>
                                <div className={`${styles.dni}`}>DNI: {u.dni || '-'}</div>
                            </td>
                            <td className={`${styles.cell}`}>
                                <Badge variant={u.role}>
                                    {t(u.role) || u.role}
                                </Badge>
                            </td>
                            <td className={`${styles.cell}`}>
                                <div className={`${styles.fullName}`}>{u.full_name || '-'}</div>
                                <div className={`${styles.phoneContainer}`}>
                                    {u.phoneNumbers && u.phoneNumbers.length > 0 ? (
                                        <>
                                            {u.phoneNumbers.find(p => p.is_primary)?.phone_number || u.phoneNumbers[0].phone_number}
                                            {u.phoneNumbers.length > 1 && <Badge variant="blue" className={`${styles.countBadge}`}>+{u.phoneNumbers.length - 1}</Badge>}
                                        </>
                                    ) : (u.phone || '-')}
                                </div>
                            </td>
                            <td className={`${styles.cell}`}>
                                <div className={`${styles.actions}`}>
                                    <Button variant="secondary" size="sm" onClick={() => onEdit(u)} title={t('edit')} icon={<Icon name="edit" />} />
                                    <Button variant="secondary" size="sm" onClick={() => onReset(u)} title={t('reset_pwd')} icon={<Icon name="key" />} />
                                    {u.role !== 'admin' && (
                                        <Button variant="outline-danger" size="sm" onClick={() => onDelete(u)} title={t('delete')} icon={<Icon name="delete" />} />
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;

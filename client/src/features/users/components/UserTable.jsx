import React from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import sharedStyles from '@/styles/shared.module.css';
import styles from './UserTable.module.css';

export const UserTable = ({ users, onEdit, onReset, onDelete }) => {
    const { t } = useLanguage();

    return (
        <div className={`${styles.UserTable__userTableWrapper}`}>
            <table className={`${styles.UserTable__table}`}>
                <thead>
                    <tr className={sharedStyles.UserTable__header}>
                        <th className={`${styles.UserTable__headerCell}`}>{t('user_header')}</th>
                        <th className={`${styles.UserTable__headerCell}`}>{t('role_header')}</th>
                        <th className={`${styles.UserTable__headerCell}`}>{t('name_contact_header')}</th>
                        <th className={`${styles.UserTable__headerCell}`}>{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className={`${styles.UserTable__row}`}>
                            <td className={`${styles.UserTable__cell}`}>
                                <div className={`${styles.UserTable__username}`}>{u.username}</div>
                                <div className={`${styles.UserTable__dni}`}>DNI: {u.dni || '-'}</div>
                            </td>
                            <td className={`${styles.UserTable__cell}`}>
                                <Badge variant={u.role}>
                                    {t(u.role) || u.role}
                                </Badge>
                            </td>
                            <td className={`${styles.UserTable__cell}`}>
                                <div className={`${styles.UserTable__fullName}`}>{u.full_name || '-'}</div>
                                <div className={`${styles.UserTable__phoneContainer}`}>
                                    {u.phoneNumbers && u.phoneNumbers.length > 0 ? (
                                        <>
                                            {u.phoneNumbers.find(p => p.is_primary)?.phone_number || u.phoneNumbers[0].phone_number}
                                            {u.phoneNumbers.length > 1 && <Badge variant="blue" className={`${styles.UserTable__countBadge}`}>+{u.phoneNumbers.length - 1}</Badge>}
                                        </>
                                    ) : (u.phone || '-')}
                                </div>
                            </td>
                            <td className={`${styles.UserTable__cell}`}>
                                <div className={`${styles.UserTable__actions}`}>
                                    <Button variant="ghost" size="sm-compact" onClick={() => onEdit(u)} title={t('edit')} icon={<Icon name="edit" />} />
                                    <Button variant="ghost" size="sm-compact" onClick={() => onReset(u)} title={t('reset_pwd')} icon={<Icon name="key" />} />
                                    {u.role !== 'admin' && (
                                        <Button variant="ghost" size="sm-compact" className={`${styles.actionBtnDelete} ${sharedStyles.TextDanger}`} onClick={() => onDelete(u)} title={t('delete')} icon={<Icon name="delete" />} />
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

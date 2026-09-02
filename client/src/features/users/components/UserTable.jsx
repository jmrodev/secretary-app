import React from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import sharedStyles from '@/styles/shared.module.css';
import styles from './UserTable.module.css';

export const UserTable = ({ users, onEdit, onReset, onDelete, onOpenPermissions }) => {
    const { t } = useLanguage();

    const renderPermissions = (u) => {
        if (u.role === 'admin') {
            return (
                <Badge variant="admin" className={styles.UserTable__permBadge}>
                    <Icon name="shield" size="0.9rem" />
                    {t('full_access')}
                </Badge>
            );
        }
        if (u.role === 'secretary') {
            const badges = [];
            const check = (key, legacyKey, labelKey) => {
                const granted = Boolean(u.permissions?.[key] ?? u[key] ?? (legacyKey ? u[legacyKey] : false));
                if (granted) {
                    badges.push(t(labelKey));
                }
            };

            check('can_manage_users', 'canManageUsers', 'badge_users');
            check('can_crud_appointments', null, 'badge_appointments');
            check('can_edit_past_appointments', null, 'badge_past_appointments');
            check('can_crud_requests', null, 'badge_requests');
            check('can_crud_prescriptions', null, 'badge_prescriptions');
            check('can_crud_licenses', null, 'badge_licenses');
            check('can_crud_files', null, 'badge_files');
            check('can_crud_finances', null, 'badge_finances');

            if (badges.length === 0) {
                return (
                    <span className={styles.UserTable__permMuted}>
                        {t('no_operational_permissions')}
                    </span>
                );
            }

            return (
                <div className={styles.UserTable__permList}>
                    {badges.map((label) => (
                        <Badge key={label} variant="success" className={styles.UserTable__permBadge}>
                            {label}
                        </Badge>
                    ))}
                </div>
            );
        }
        if (u.role === 'doctor') {
            return (
                <span className={styles.UserTable__permMuted}>
                    {t('standard_access')}
                </span>
            );
        }
        return <span className={styles.UserTable__permMuted}>-</span>;
    };

    return (
        <div className={`${styles.UserTable__userTableWrapper}`}>
            <table className={`${styles.UserTable__table}`}>
                <thead>
                    <tr className={sharedStyles.UserTable__header}>
                        <th className={`${styles.UserTable__headerCell}`}>{t('user_header')}</th>
                        <th className={`${styles.UserTable__headerCell}`}>{t('role_header')}</th>
                        <th className={`${styles.UserTable__headerCell}`}>{t('permissions_header')}</th>
                        <th className={`${styles.UserTable__headerCell}`}>{t('name_contact_header')}</th>
                        <th className={`${styles.UserTable__headerCell}`}>{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className={`${styles.UserTable__row}`}>
                            <td className={`${styles.UserTable__cell}`}>
                                <div className={`${styles.UserTable__username}`}>{u.username}</div>
                                <div className={`${styles.UserTable__dni}`}>{t('dni_label')} {u.dni || '-'}</div>
                            </td>
                            <td className={`${styles.UserTable__cell}`}>
                                <Badge variant={u.role}>
                                    {t(u.role) || u.role}
                                </Badge>
                            </td>
                            <td className={`${styles.UserTable__cell}`}>
                                {renderPermissions(u)}
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
                                    {u.role === 'secretary' && onOpenPermissions && (
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => onOpenPermissions(u)}
                                            title={t('edit_permissions')}
                                            icon={<Icon name="tune" size="1rem" />}
                                        />
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => onEdit(u)}
                                        title={t('edit')}
                                        icon={<Icon name="edit" size="1rem" />}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => onReset(u)}
                                        title={t('reset_pwd')}
                                        icon={<Icon name="key" size="1rem" />}
                                    />
                                    {u.role !== 'admin' && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm-compact"
                                            onClick={() => onDelete(u)}
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
        </div>
    );
};

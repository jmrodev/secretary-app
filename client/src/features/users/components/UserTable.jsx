import React from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/context/LanguageContext';
import './UserTable.css';

const UserTable = ({ users, onEdit, onReset, onDelete }) => {
    const { t } = useLanguage();

    return (
        <section className="user-table-wrapper">
            <table className="user-table__table table-base">
                <thead>
                    <tr className="user-table__header">
                        <th className="user-table__header-cell">{t('user_header')}</th>
                        <th className="user-table__header-cell">{t('role_header')}</th>
                        <th className="user-table__header-cell">{t('name_contact_header')}</th>
                        <th className="user-table__header-cell">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className="user-table__row">
                            <td className="user-table__cell">
                                <div className="user-table__username">{u.username}</div>
                                <div className="user-table__dni">DNI: {u.dni || '-'}</div>
                            </td>
                            <td className="user-table__cell">
                                <Badge variant={u.role}>
                                    {t(u.role) || u.role}
                                </Badge>
                            </td>
                            <td className="user-table__cell">
                                <div className="user-table__full-name">{u.full_name || '-'}</div>
                                <div className="user-table__phone-container">
                                    {u.phoneNumbers && u.phoneNumbers.length > 0 ? (
                                        <>
                                            {u.phoneNumbers.find(p => p.is_primary)?.phone_number || u.phoneNumbers[0].phone_number}
                                            {u.phoneNumbers.length > 1 && <Badge variant="blue" className="user-table__count-badge">+{u.phoneNumbers.length - 1}</Badge>}
                                        </>
                                    ) : (u.phone || '-')}
                                </div>
                            </td>
                            <td className="user-table__cell">
                                <div className="user-table__actions">
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={() => onEdit(u)} 
                                        title={t('edit')}
                                        icon={<Icon name="edit" />}
                                    />
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={() => onReset(u)} 
                                        title={t('reset_pwd')}
                                        icon={<Icon name="vpn_key" />}
                                    />
                                    {u.role !== 'admin' && (
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm" 
                                            onClick={() => onDelete(u)} 
                                            title={t('delete')}
                                            icon={<Icon name="delete" />}
                                        />
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
};

export default UserTable;

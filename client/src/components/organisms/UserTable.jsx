import React from 'react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import { useLanguage } from '../../context/LanguageContext';

const UserTable = ({ users, onEdit, onReset, onDelete }) => {
    const { t } = useLanguage();

    return (
        <div className="overflow-x-auto">
            <table className="table-base w-full">
                <thead>
                    <tr className="text-left bg-slate-50">
                        <th className="p-3 border-b">{t('user_header') || 'Usuario'}</th>
                        <th className="p-3 border-b">{t('role_header') || 'Rol'}</th>
                        <th className="p-3 border-b">{t('name_contact_header') || 'Nombre y Teléfono'}</th>
                        <th className="p-3 border-b text-right">{t('actions') || 'Acciones'}</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className="border-b transition-colors hover:bg-slate-50/50">
                            <td className="p-3">
                                <div className="font-bold text-main-900">{u.username}</div>
                                <div className="text-xs text-slate-500">DNI: {u.dni || '-'}</div>
                            </td>
                            <td className="p-3">
                                <Badge variant={u.role}>
                                    {t(u.role) || u.role}
                                </Badge>
                            </td>
                            <td className="p-3">
                                <div className="font-medium">{u.full_name || '-'}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                    {u.phoneNumbers && u.phoneNumbers.length > 0 ? (
                                        <>
                                            {u.phoneNumbers.find(p => p.is_primary)?.phone_number || u.phoneNumbers[0].phone_number}
                                            {u.phoneNumbers.length > 1 && <Badge variant="blue" className="text-[10px] px-1">+{u.phoneNumbers.length - 1}</Badge>}
                                        </>
                                    ) : (u.phone || '-')}
                                </div>
                            </td>
                            <td className="p-3">
                                <div className="flex gap-2 justify-end">
                                    <Button variant="secondary" size="sm" onClick={() => onEdit(u)} title={t('edit')}>✏️</Button>
                                    <Button variant="secondary" size="sm" onClick={() => onReset(u)} title={t('reset_pwd')}>🔑</Button>
                                    {u.role !== 'admin' && (
                                        <Button variant="outline-danger" size="sm" onClick={() => onDelete(u)} title={t('delete')}>🗑️</Button>
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

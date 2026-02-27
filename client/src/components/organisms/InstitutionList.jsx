import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';
import './InstitutionList.css';

const InstitutionList = ({ institutions, onEdit, onDelete, t }) => {

    if (institutions.length === 0) {
        return (
            <div className="card p-12 text-center text-main-500 bg-gray-50 flex flex-col items-center gap-4">
                <Icon name="business" size="3rem" className="opacity-20" />
                <p className="text-lg font-medium opacity-50">{t('no_institutions') || 'No hay instituciones registradas'}</p>
            </div>
        );
    }

    return (
        <div className="institution-list animate-fadeIn">
            <table className="institution-list__table">
                <thead>
                    <tr>
                        <th className="institution-list__th">{t('name') || 'Nombre'}</th>
                        <th className="institution-list__th">{t('base_amount') || 'Monto Base'}</th>
                        <th className="institution-list__th">{t('pending_debt') || 'Deuda Pendiente'}</th>
                        <th className="institution-list__th">{t('status') || 'Estado'}</th>
                        <th className="institution-list__th text-right">{t('actions') || 'Acciones'}</th>
                    </tr>
                </thead>
                <tbody>
                    {institutions.map(inst => (
                        <tr key={inst.id} className="institution-list__row">
                            <td className="institution-list__td">
                                <span className="institution-list__name">{inst.name}</span>
                            </td>
                            <td className="institution-list__td">
                                <span className="institution-list__price">${Number(inst.base_price || 0).toLocaleString()}</span>
                            </td>
                            <td className="institution-list__td">
                                <span className="institution-list__debt">${Number(inst.total_debt || 0).toLocaleString()}</span>
                            </td>
                            <td className="institution-list__td">
                                <Badge variant={inst.status === 'active' ? 'green' : 'red'}>
                                    {t(inst.status) || inst.status}
                                </Badge>
                            </td>
                            <td className="institution-list__td">
                                <div className="institution-list__actions">
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

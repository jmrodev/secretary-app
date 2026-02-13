import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

const InstitutionList = ({ institutions, onEdit, onDelete, t }) => {

    if (institutions.length === 0) {
        return (
            <div className="card p-8 text-center text-main-500">
                <p>{t('no_institutions')}</p>
            </div>
        );
    }

    return (
        <div className="institution-list">
            <table className="institution-list__table">
                <thead>
                    <tr>
                        <th className="institution-list__th">{t('name')}</th>
                        <th className="institution-list__th">{t('base_amount')}</th>
                        <th className="institution-list__th">{t('pending_debt')}</th>
                        <th className="institution-list__th">{t('status')}</th>
                        <th className="institution-list__th">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {institutions.map(inst => (
                        <tr key={inst.id}>
                            <td className="institution-list__td">
                                <span className="institution-list__name">{inst.name}</span>
                            </td>
                            <td className="institution-list__td">
                                <span className="institution-list__price">${inst.base_price}</span>
                            </td>
                            <td className="institution-list__td">
                                <span className="institution-list__debt">${inst.total_debt}</span>
                            </td>
                            <td className="institution-list__td">
                                <Badge variant={inst.status === 'active' ? 'green' : 'red'}>
                                    {t(inst.status)}
                                </Badge>
                            </td>
                            <td className="institution-list__td">
                                <div className="institution-list__actions">
                                    <Button variant="ghost" size="sm-compact" onClick={() => onEdit(inst)}>
                                        ✏️
                                    </Button>
                                    <Button variant="ghost" size="sm-compact" className="btn--danger-ghost" onClick={() => onDelete(inst.id)}>
                                        🗑️
                                    </Button>
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

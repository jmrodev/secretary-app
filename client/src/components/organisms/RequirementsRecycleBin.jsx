import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

const RequirementsRecycleBin = ({ recycleRequests, handleRestore, t }) => {
    if (recycleRequests.length === 0) {
        return (
            <div className="requirements-list__empty">
                <Icon name="delete_sweep" size="3rem" />
                <p>{t('recycle_empty') || 'No hay elementos en la papelera.'}</p>
            </div>
        );
    }

    return (
        <div className="requirements-list__table-container">
            <table className="requirements-list__table">
                <thead className="requirements-list__table-head">
                    <tr className="requirements-list__table-row">
                        <th className="requirements-list__table-header">{t('element') || 'Elemento'}</th>
                        <th className="requirements-list__table-header">{t('deleted_by') || 'Eliminado Por'}</th>
                        <th className="requirements-list__table-header">{t('delete_date') || 'Fecha Eliminación'}</th>
                        <th className="requirements-list__table-header">{t('expires') || 'Expira'}</th>
                        <th className="requirements-list__table-header">{t('actions') || 'Acciones'}</th>
                    </tr>
                </thead>
                <tbody className="requirements-list__table-body">
                    {recycleRequests.map(item => (
                        <tr key={item.id} className="requirement-item">
                            <td className="requirement-item__cell requirement-item__patient-name">{item.entity_name}</td>
                            <td className="requirement-item__cell">{item.deleted_by_name}</td>
                            <td className="requirement-item__cell">{new Date(item.deleted_at).toLocaleString()}</td>
                            <td className="requirement-item__cell">{new Date(item.expires_at).toLocaleDateString()}</td>
                            <td className="requirement-item__cell">
                                <div className="requirement-item__actions">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleRestore(item)}
                                        icon={<Icon name="restore" size="1rem" />}
                                    >
                                        {t('restore') || 'Restaurar'}
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

export default RequirementsRecycleBin;

import React from 'react';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import { formatDate, formatDateTimeLong } from '../../../utils/dateUtils';

const MedicalRequirementRecycleBin = ({ recycleRequests, handleRestore, t }) => {
    if (recycleRequests.length === 0) {
        return (
            <div className="medical-requirement-manager__empty">
                <Icon name="delete_sweep" size="3rem" />
                <p>{t('recycle_empty') || 'No hay elementos en la papelera.'}</p>
            </div>
        );
    }

    return (
        <div className="medical-requirement-manager__table-container">
            <table className="medical-requirement-manager__table">
                <thead className="medical-requirement-manager__table-head">
                    <tr className="medical-requirement-manager__table-row">
                        <th className="medical-requirement-manager__table-header">{t('element') || 'Elemento'}</th>
                        <th className="medical-requirement-manager__table-header">{t('deleted_by') || 'Eliminado Por'}</th>
                        <th className="medical-requirement-manager__table-header">{t('delete_date') || 'Fecha Eliminación'}</th>
                        <th className="medical-requirement-manager__table-header">{t('expires') || 'Expira'}</th>
                        <th className="medical-requirement-manager__table-header">{t('actions') || 'Acciones'}</th>
                    </tr>
                </thead>
                <tbody className="medical-requirement-manager__table-body">
                    {recycleRequests.map(item => (
                        <tr key={item.id} className="requirement-item">
                            <td className="requirement-item__cell requirement-item__patient-name">{item.entity_name}</td>
                            <td className="requirement-item__cell">{item.deleted_by_name}</td>
                            <td className="requirement-item__cell">{formatDateTimeLong(item.deleted_at)}</td>
                            <td className="requirement-item__cell">{formatDate(item.expires_at)}</td>
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

export default MedicalRequirementRecycleBin;

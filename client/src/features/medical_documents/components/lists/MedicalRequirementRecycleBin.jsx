import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { formatDate, formatDateTimeLong } from '@/utils/core/dateUtils';
import managerStyles from '@/features/medical_documents/components/ui/MedicalRequirementManager.module.css';
import itemStyles from '@/features/medical_documents/components/sections/RequirementItem.module.css';

export const MedicalRequirementRecycleBin = ({ recycleRequests, handleRestore, t }) => {
    if (recycleRequests.length === 0) {
        return (
            <div className={managerStyles.empty}>
                <Icon name="delete_sweep" size="3rem" />
                <p>{t('recycle_empty') || 'No hay elementos en la papelera.'}</p>
            </div>
        );
    }

    return (
        <div className={managerStyles.tableContainer}>
            <table className={managerStyles.table}>
                <thead>
                    <tr>
                        <th className={managerStyles.tableHeader}>{t('element') || 'Elemento'}</th>
                        <th className={managerStyles.tableHeader}>{t('deleted_by') || 'Eliminado Por'}</th>
                        <th className={managerStyles.tableHeader}>{t('delete_date') || 'Fecha Eliminación'}</th>
                        <th className={managerStyles.tableHeader}>{t('expires') || 'Expira'}</th>
                        <th className={managerStyles.tableHeader}>{t('actions') || 'Acciones'}</th>
                    </tr>
                </thead>
                <tbody>
                    {recycleRequests.map(item => (
                        <tr key={item.id} className={itemStyles.root}>
                            <td className={itemStyles.cell}>{item.entity_name}</td>
                            <td className={itemStyles.cell}>{item.deleted_by_name}</td>
                            <td className={itemStyles.cell}>{formatDateTimeLong(item.deleted_at)}</td>
                            <td className={itemStyles.cell}>{formatDate(item.expires_at)}</td>
                            <td className={itemStyles.cell}>
                                <div className={itemStyles.actions}>
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


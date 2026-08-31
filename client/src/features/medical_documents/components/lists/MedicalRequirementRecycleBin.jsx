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
                <p>{t('recycle_empty')}</p>
            </div>
        );
    }

    return (
        <div className={managerStyles.tableContainer}>
            <table className={managerStyles.table}>
                <thead>
                    <tr>
                        <th className={managerStyles.tableHeader}>{t('element')}</th>
                        <th className={managerStyles.tableHeader}>{t('deleted_by')}</th>
                        <th className={managerStyles.tableHeader}>{t('delete_date')}</th>
                        <th className={managerStyles.tableHeader}>{t('expires')}</th>
                        <th className={managerStyles.tableHeader}>{t('actions')}</th>
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
                                        {t('restore')}
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


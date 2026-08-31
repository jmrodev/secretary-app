import React from 'react';
import { Pagination } from '@/components/atoms/Pagination';
import { TabButton } from '@/components/atoms/TabButton';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { RequirementItem } from '@/features/medical_documents/components/sections/RequirementItem';
import managerStyles from '@/features/medical_documents/components/ui/MedicalRequirementManager.module.css';

export const MedicalRequirementTable = ({
    requests,
    filter,
    setFilter,
    handleNewTab,
    setSelectedRequest,
    handleDelete,
    openActionModal,
    canDeleteRequest,
    isAdminOrSecretary,
    hideFilters,
    typeLabels,
    setPaymentModal,
    t,
    // Pagination Props
    currentPage,
    totalPages,
    onPageChange
}) => {
    return (
        <div className={`${managerStyles.MedicalRequirementManager__content} animate-fade-in`}>
            {!hideFilters && (
                <div className={managerStyles.MedicalRequirementManager__filters}>
                    <TabButton
                        variant="pill"
                        isActive={filter === 'active'}
                        onClick={() => setFilter('active')}
                    >
                        {t('pending')}
                    </TabButton>
                    <TabButton
                        variant="pill"
                        isActive={filter === 'history'}
                        onClick={() => setFilter('history')}
                    >
                        {t('history')}
                    </TabButton>
                </div>
            )}

            {requests.length === 0 ? (
                <div className={managerStyles.MedicalRequirementManager__empty}>
                    <Icon name="inbox" size="3rem" />
                    <p>{t('no_requests')}</p>
                    {filter === 'active' && (
                        <Button
                            variant="primary"
                            onClick={handleNewTab}
                            icon={<Icon name="add_circle" />}
                        >
                            {t('create_first_request')}
                        </Button>
                    )}
                </div>
            ) : (
                <div className={managerStyles.MedicalRequirementManager__tableContainer}>
                    <table className={managerStyles.MedicalRequirementManager__table}>
                        <thead>
                            <tr>
                                <th className={managerStyles.MedicalRequirementManager__tableHeader}>{t('type')}</th>
                                <th className={managerStyles.MedicalRequirementManager__tableHeader}>{t('date')}</th>
                                <th className={managerStyles.MedicalRequirementManager__tableHeader}>{t('patient')}</th>
                                <th className={managerStyles.MedicalRequirementManager__tableHeader}>{t('status')}</th>
                                <th className={managerStyles.MedicalRequirementManager__tableHeader}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(r => (
                                <RequirementItem
                                    key={r.id}
                                    request={r}
                                    typeLabel={typeLabels[r.type] || r.type}
                                    onSelect={setSelectedRequest}
                                    onDelete={handleDelete}
                                    onAction={openActionModal}
                                    canDelete={canDeleteRequest}
                                    isAdminOrSecretary={isAdminOrSecretary}
                                    setPaymentModal={setPaymentModal}
                                    t={t}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        t={t}
                    />
                </div>
            )}
        </div>
    );
};


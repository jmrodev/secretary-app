import React from 'react';
import Pagination from '@/components/atoms/Pagination';
import TabButton from '@/components/atoms/TabButton';
import Icon from '@/components/atoms/Icon';
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
        <div className={`${managerStyles.content} animate-fade-in`}>
            {!hideFilters && (
                <div className={managerStyles.filters}>
                    <TabButton
                        variant="pill"
                        isActive={filter === 'active'}
                        onClick={() => setFilter('active')}
                    >
                        {t('pending') || 'Pendientes'}
                    </TabButton>
                    <TabButton
                        variant="pill"
                        isActive={filter === 'history'}
                        onClick={() => setFilter('history')}
                    >
                        {t('history') || 'Historial'}
                    </TabButton>
                </div>
            )}

            {requests.length === 0 ? (
                <div className={managerStyles.empty}>
                    <Icon name="inbox" size="3rem" />
                    <p>{t('no_requests') || (filter === 'active' ? 'No hay requerimientos pendientes.' : 'No hay historial.')}</p>
                    {filter === 'active' && (
                        <Button
                            variant="primary"
                            onClick={handleNewTab}
                            icon={<Icon name="add_circle" />}
                        >
                            {t('create_first_request') || 'Crear primera solicitud'}
                        </Button>
                    )}
                </div>
            ) : (
                <div className={managerStyles.tableContainer}>
                    <table className={managerStyles.table}>
                        <thead>
                            <tr>
                                <th className={managerStyles.tableHeader}>{t('type') || 'Tipo'}</th>
                                <th className={managerStyles.tableHeader}>{t('date') || 'Fecha'}</th>
                                <th className={managerStyles.tableHeader}>{t('patient') || 'Paciente'}</th>
                                <th className={managerStyles.tableHeader}>{t('status') || 'Estado'}</th>
                                <th className={managerStyles.tableHeader}>{t('actions') || 'Acciones'}</th>
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


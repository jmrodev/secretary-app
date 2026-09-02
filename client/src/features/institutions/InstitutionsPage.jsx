import React from 'react';
import { MainLayout } from '@/components/templates/MainLayout';
import { Button } from '@/components/atoms/Button';
import { Loading } from '@/components/atoms/Loading';
import { Icon } from '@/components/atoms/Icon';
import { InstitutionFinances } from '@/features/finances/components/sections/InstitutionFinances';
import { useInstitutionsController } from '@/features/institutions/hooks/useInstitutionsController';
import { InstitutionFormModal } from '@/features/institutions/components/forms/InstitutionFormModal';

import { FeatureToolbar } from '@/components/organisms/FeatureToolbar';

/**
 * InstitutionsPage (Orchestrator).
 * Manages institutional payers and agreements.
 */
export const InstitutionsPage = () => {
    const {
        institutions,
        loading,
        isFormModalOpen,
        editingInstitution,
        formData,
        handlers,
        t
    } = useInstitutionsController();

    const {
        handleOpenFormModal,
        handleCloseFormModal,
        handleFormSubmit,
        handleDelete,
        handleInputChange,
    } = handlers;

    const [_selectedInstId, setSelectedInstId] = React.useState('');
    const selectedInstId = _selectedInstId || (institutions.length > 0 ? String(institutions[0].id) : '');
    const [viewMode, setViewMode] = React.useState('transactions');

    return (
        <MainLayout wide flush title={t('institutions')}>
            <div>
                <div>
                    {loading && institutions.length === 0 ? (
                        <Loading variant="centered" text={t('loading')} />
                    ) : (
                        <>
                            <FeatureToolbar
                                className="__top-actions"
                                tabs={institutions.map(inst => ({
                                    id: String(inst.id),
                                    label: inst.name,
                                    icon: 'business',
                                    badge: Number(inst.pending_count) > 0 ? inst.pending_count : null
                                }))}
                                activeTab={selectedInstId}
                                onTabChange={setSelectedInstId}
                                actions={
                                    <div className="institutions-page__toolbar-actions">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleOpenFormModal()}
                                            icon={<Icon name="add" size="1.1rem" />}
                                        >
                                            {t('new_institution')}
                                        </Button>
                                        
                                        {selectedInstId && (
                                            <div className="institutions-page__selected-actions">
                                                <Button
                                                    variant="action-edit"
                                                    size="sm-compact"
                                                    onClick={() => handleOpenFormModal(institutions.find(i => String(i.id) === selectedInstId))}
                                                    title={t('edit')}
                                                    icon={<Icon name="edit" size="1rem" />}
                                                />
                                                <Button
                                                    variant="action-delete"
                                                    size="sm-compact"
                                                    onClick={() => handleDelete(Number(selectedInstId))}
                                                    title={t('delete')}
                                                    icon={<Icon name="delete" size="1rem" />}
                                                />
                                            </div>
                                        )}
                                    </div>
                                }
                            />

                            <section className="dashboard-layout__main dashboard-layout__main--full">
                                <div className="dashboard-card no-padding">
                                    <div className="institutions__content ">
                                        <InstitutionFinances
                                            institutions={institutions}
                                            selectedInstId={selectedInstId}
                                            viewMode={viewMode}
                                            setViewMode={setViewMode}
                                            t={t}
                                        />
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                <InstitutionFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseFormModal}
                    onSubmit={handleFormSubmit}
                    formData={formData}
                    onChange={handleInputChange}
                    isEditing={!!editingInstitution}
                    t={t}
                />
            </div>
        </MainLayout>
    );
};

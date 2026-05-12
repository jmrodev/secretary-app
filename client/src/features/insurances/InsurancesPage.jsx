import React from 'react';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import Card from '@/components/atoms/Card';
import Icon from '@/components/atoms/Icon';
import { useInsurancesController, InsuranceList, InsuranceFormModal } from '@/features/insurances/index';
import MainLayout from '@/components/templates/MainLayout';
import './InsurancesPage.css';

import FeatureToolbar from '@/components/organisms/FeatureToolbar';

/**
 * InsurancesPage (Orchestrator).
 * Manages healthcare providers and insurance schemes.
 */
const InsurancesPage = () => {
    const {
        filteredInsurances,
        loading,
        searchTerm,
        modalOpen,
        editingId,
        formData,
        setSearchTerm,
        setModalOpen,
        setFormData,
        handlers,
        t
    } = useInsurancesController();

    const {
        handleOpenCreate,
        handleOpenEdit,
        handleSubmit,
        handleDelete,
    } = handlers;

    return (
        <MainLayout wide flush title={t('insurances') || 'Obras Sociales'}>
            <div className="insurances-page-orchestrator layout-content-area animate-fade-in">
                <FeatureToolbar
                    className="insurances-page-orchestrator__toolbar"
                    actions={
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleOpenCreate}
                            icon={<Icon name="add" size="1.1rem" />}
                        >
                            {t('new_insurance') || 'Nueva Obra Social'}
                        </Button>
                    }
                />

                <main className="insurances-page-orchestrator__main">
                    {loading && filteredInsurances.length === 0 ? (
                        <Loading variant="centered" text={t('loading') || "Cargando..."} />
                    ) : (
                        <Card noPadding>
                            <div className="insurances__content animate-fade-in">
                                <InsuranceList
                                    insurances={filteredInsurances}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleDelete}
                                    hasFilter={searchTerm !== ''}
                                />
                            </div>
                        </Card>
                    )}
                </main>
            </div>

                <InsuranceFormModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleSubmit}
                    formData={formData}
                    setFormData={setFormData}
                    isEditing={!!editingId}
                />
        </MainLayout>
    );
};

export default InsurancesPage;

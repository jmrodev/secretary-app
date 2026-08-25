import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Loading } from '@/components/atoms/Loading';
import { Card } from '@/components/atoms/Card';
import { Icon } from '@/components/atoms/Icon';
import { useInsurancesController } from '@/features/insurances/hooks/useInsurancesController';
import { InsuranceList } from '@/features/insurances/components/InsuranceList';
import { InsuranceFormModal } from '@/features/insurances/components/InsuranceFormModal';
import { MainLayout } from '@/components/templates/MainLayout';
import styles from './InsurancesPage.module.css';

import { FeatureToolbar } from '@/components/organisms/FeatureToolbar';

/**
 * InsurancesPage (Orchestrator).
 * Manages healthcare providers and insurance schemes.
 */
export const InsurancesPage = () => {
    const {
        filteredInsurances,
        loading,
        searchTerm,
        modalOpen,
        editingId,
        formData,
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
            <div className={`${styles.InsurancesPage__root}  `}>
                <FeatureToolbar
                    className="__toolbar"
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

                <section className={`${styles.InsurancesPage__main}`}>
                    {loading && filteredInsurances.length === 0 ? (
                        <Loading variant="centered" text={t('loading') || "Cargando..."} />
                    ) : (
                        <Card noPadding>
                            <div className={`${styles.InsurancesPage__content} `}>
                                <InsuranceList
                                    insurances={filteredInsurances}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleDelete}
                                    hasFilter={searchTerm !== ''}
                                />
                            </div>
                        </Card>
                    )}
                </section>
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

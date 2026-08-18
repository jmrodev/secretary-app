import React from 'react';
import { InstitutionList } from '@/features/institutions/components/views/InstitutionList';
import { InstitutionFormModal } from '@/features/institutions/components/forms/InstitutionFormModal';
import { Icon } from '@/components/atoms/Icon';
import { TabNav } from '@/components/molecules/TabNav';
import { TabButton } from '@/components/atoms/TabButton';
import { Button } from '@/components/atoms/Button';
import styles from './InstitutionManager.module.css';

export const InstitutionManager = ({
    institutions,
    activeTab,
    setActiveTab,
    isFormModalOpen,
    editingInstitution,
    formData,
    handlers,
    t,
    InstitutionFinancesComponent
}) => {
    const {
        handleOpenFormModal,
        handleCloseFormModal,
        handleFormSubmit,
        handleDelete,
        handleInputChange,
    } = handlers;

    return (
        <div className={`${styles.InstitutionManager__root}`}>
            <header className={`${styles.InstitutionManager__header}`}>
                <h2 className={`${styles.InstitutionManager__title}`}>{t('institutions') || 'Instituciones'}</h2>
                <p className={`${styles.InstitutionManager__subtitle}`}>{t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}</p>
            </header>

            <div className={`${styles.InstitutionManager__nav}`}>
                <TabNav className="institution-manager__tab-nav">
                    <TabButton
                        isActive={activeTab === 'list'}
                        onClick={() => setActiveTab('list')}
                        icon={<Icon name="view_list" size="1rem" />}
                    >
                        {t('list') || 'Lista'}
                    </TabButton>
                    {InstitutionFinancesComponent && (
                        <TabButton
                            isActive={activeTab === 'finances'}
                            onClick={() => setActiveTab('finances')}
                            icon={<Icon name="analytics" size="1rem" />}
                        >
                            {t('finances') || 'Finanzas'}
                        </TabButton>
                    )}
                </TabNav>
            </div>

            <div className={`${styles.InstitutionManager__card} dashboard-card`}>
                {/* Actions Header inside card */}
                {activeTab === 'list' && (
                    <div className={`${styles.InstitutionManager__actions}`}>
                        <Button
                            variant="primary"
                            size="sm"
                            className={`${styles.InstitutionManager__actionBtn}`}
                            onClick={() => handleOpenFormModal()}
                            icon={<Icon name="add" size="1.1rem" />}
                        >
                            {t('new_institution') || 'Nueva Institución'}
                        </Button>
                    </div>
                )}

                <div className={`${styles.InstitutionManager__listContainer}`}>
                    {activeTab === 'list' ? (

                        <InstitutionList
                            institutions={institutions}
                            onEdit={handleOpenFormModal}
                            onDelete={handleDelete}
                            t={t}
                        />
                    ) : (
                        InstitutionFinancesComponent && <InstitutionFinancesComponent institutions={institutions} t={t} />
                    )}
                </div>
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
    );
};


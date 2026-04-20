import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import { InstitutionFinances } from '@/features/finances';
import { useInstitutionsController, InstitutionFormModal } from '@/features/institutions/index';
import { PageHeader } from '@/features/layout';
import heroBg from '@/features/dashboard/assets/dashboard_hero.png';
import './InstitutionsPage.css';

/**
 * InstitutionsPage (Orchestrator).
 * Manages institutional payers and agreements.
 */
const InstitutionsPage = () => {
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

    const [selectedInstId, setSelectedInstId] = React.useState('');
    const [viewMode, setViewMode] = React.useState('transactions');

    return (
        <MainLayout wide>
            <div className="institutions-page-orchestrator">
                <PageHeader 
                    variant="premium"
                    backgroundUrl={heroBg}
                    title={t('institutions') || 'Instituciones'}
                    subtitle={t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}
                    hideDoctorSelector={true}
                />
                
                <div className="layout-content-area animate-fadeIn">
                    {loading ? (
                        <Loading variant="centered" text={t('loading') || "Cargando..."} />
                    ) : (
                        <div className="dashboard-grid animate-fadeIn">
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="build" size="1.2rem" />
                                    {t('actions') || 'Acciones'}
                                </h3>
                                <div className="institutions-sidebar__actions">
                                    <Button
                                        variant="primary"
                                        className="institutions-sidebar__add-btn"
                                        onClick={() => handleOpenFormModal()}
                                        icon={<Icon name="add" size="1.1rem" />}
                                    >
                                        {t('new_institution') || 'Nueva Institución'}
                                    </Button>

                                    {institutions.length > 0 && (
                                        <div className="institutions-sidebar__list">
                                            <p className="institutions-sidebar__list-label">
                                                {t('institutions') || 'Instituciones'}
                                            </p>
                                            {institutions.map(inst => (
                                                <div
                                                    key={inst.id}
                                                    className={`institution-item ${selectedInstId === String(inst.id) ? 'institution-item--active' : ''}`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        active={selectedInstId === String(inst.id)}
                                                        onClick={() => setSelectedInstId(String(inst.id))}
                                                        className="institution-item__btn"
                                                    >
                                                        <span className="institution-item__name">{inst.name}</span>
                                                        {Number(inst.pending_count) > 0 && (
                                                            <span className="institution-item__badge">
                                                                {inst.pending_count}
                                                            </span>
                                                        )}
                                                    </Button>
                                                    <div className="institution-item__actions">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm-compact"
                                                            onClick={() => handleOpenFormModal(inst)}
                                                            title={t('edit')}
                                                            className="institution-item__action-btn institution-item__action-btn--edit"
                                                            icon={<Icon name="edit" size="0.9rem" />}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm-compact"
                                                            onClick={() => handleDelete(inst.id)}
                                                            title={t('delete')}
                                                            className="institution-item__action-btn institution-item__action-btn--delete"
                                                            icon={<Icon name="delete" size="0.9rem" />}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>

                        <main className="dashboard-main">
                            <div className="dashboard-card no-padding">
                                <div className="institutions__content animate-fadeIn">
                                    <InstitutionFinances
                                        institutions={institutions}
                                        selectedInstId={selectedInstId}
                                        viewMode={viewMode}
                                        setViewMode={setViewMode}
                                        t={t}
                                    />
                                </div>
                            </div>
                        </main>
                    </div>
                )}

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
            </div>
        </MainLayout>
    );
};

export default InstitutionsPage;



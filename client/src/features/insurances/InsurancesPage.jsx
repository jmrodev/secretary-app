import React from 'react';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import SearchBar from '@/components/molecules/SearchBar';
import { useInsurancesController, InsuranceList, InsuranceFormModal } from './index';
import './InsurancesPage.css';

import MainLayout from '@/components/templates/MainLayout';

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
        <MainLayout wide>
            <div className="insurances-page-orchestrator">
            <header className="dashboard-header animate-fadeIn">
                <h1 className="dashboard-header__title">{t('insurances') || 'Obras Sociales'}</h1>
                <p className="dashboard-header__subtitle">{t('insurances_subtitle') || 'Gestione las obras sociales y prepagas del sistema.'}</p>
            </header>

            <div className="dashboard-nav-bar dashboard-nav-bar--centered animate-fadeIn">
                <div className="insurances-page__counter">
                    <Icon name="monitor_heart" size="1.2rem" />
                    {filteredInsurances.length} {t('insurances_count') || 'Obras sociales activas'}
                </div>
            </div>

            {loading ? (
                <Loading variant="centered" text={t('loading') || "Cargando..."} />
            ) : (
                <div className="dashboard-grid animate-fadeIn">
                    <aside className="dashboard-sidebar">
                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">
                                <Icon name="search" size="1.2rem" />
                                {t('search') || 'Buscar'}
                            </h3>
                            <SearchBar
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('search_insurances_placeholder') || 'Buscar por nombre, CUIT...'}
                            />
                        </div>

                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">
                                <Icon name="build" size="1.2rem" />
                                {t('actions') || 'Acciones'}
                            </h3>
                            <div className="insurances-page__actions-group">
                                <Button
                                    variant="primary"
                                    className="insurances-page__add-btn"
                                    onClick={handleOpenCreate}
                                    icon={<Icon name="add" size="1.1rem" />}
                                >
                                    {t('new_insurance') || 'Nueva Obra Social'}
                                </Button>
                            </div>
                        </div>
                    </aside>

                    <main className="dashboard-main">
                        <div className="dashboard-card no-padding">
                            <div className="insurances__content animate-fadeIn">
                                <InsuranceList
                                    insurances={filteredInsurances}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleDelete}
                                    hasFilter={searchTerm !== ''}
                                />
                            </div>
                        </div>
                    </main>
                </div>
            )}

            <InsuranceFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                isEditing={!!editingId}
            />
        </div>
        </MainLayout>
    );
};

export default InsurancesPage;

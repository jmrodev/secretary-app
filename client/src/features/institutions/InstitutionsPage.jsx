import React from 'react';
import MainLayout from '../../components/templates/MainLayout';
import Button from '../../components/atoms/Button';
import Loading from '../../components/atoms/Loading';
import Icon from '../../components/atoms/Icon';
import { InstitutionFinances } from '../finances';
import { useInstitutionsController, InstitutionFormModal } from './index';
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
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('institutions') || 'Instituciones'}</h1>
                    <p className="dashboard-header__subtitle">{t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}</p>
                </header>

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
                                        className="justify-start w-full"
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
                                                    <button
                                                        onClick={() => setSelectedInstId(String(inst.id))}
                                                        className={`institution-item__btn ${selectedInstId === String(inst.id) ? 'institution-item__btn--active' : ''}`}
                                                    >
                                                        <span className="institution-item__name">{inst.name}</span>
                                                        {Number(inst.pending_count) > 0 && (
                                                            <span className="institution-item__badge">
                                                                {inst.pending_count}
                                                            </span>
                                                        )}
                                                    </button>
                                                    <div className="institution-item__actions">
                                                        <button
                                                            onClick={() => handleOpenFormModal(inst)}
                                                            title={t('edit')}
                                                            className="institution-item__action-btn institution-item__action-btn--edit"
                                                        >
                                                            <Icon name="edit" size="0.9rem" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(inst.id)}
                                                            title={t('delete')}
                                                            className="institution-item__action-btn institution-item__action-btn--delete"
                                                        >
                                                            <Icon name="delete" size="0.9rem" />
                                                        </button>
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
        </MainLayout>
    );
};

export default InstitutionsPage;



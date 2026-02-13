
import React from 'react';
import MainLayout from '../components/templates/MainLayout';
import Button from '../components/atoms/Button';
import Loading from '../components/atoms/Loading';
import TabButton from '../components/atoms/TabButton';
import TabNav from '../components/molecules/TabNav';
import InstitutionList from '../components/organisms/InstitutionList';
import InstitutionFinances from '../components/organisms/InstitutionFinances';
import InstitutionFormModal from '../components/organisms/InstitutionFormModal';
import { useInstitutionsController } from '../controllers/useInstitutionsController';

const Institutions = () => {
    const {
        institutions,
        loading,
        activeTab,
        setActiveTab,
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

    return (
        <MainLayout wide>
            <div className="institutions-page">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('institutions') || 'Instituciones'}</h1>
                    <p className="dashboard-header__subtitle">{t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}</p>
                </header>

                <div className="dashboard-nav-bar dashboard-nav-bar--centered animate-fadeIn">
                    <TabNav className="institutions__nav">
                        <TabButton
                            isActive={activeTab === 'list'}
                            onClick={() => setActiveTab('list')}
                        >
                            📋 {t('list') || 'Lista'}
                        </TabButton>
                        <TabButton
                            isActive={activeTab === 'finances'}
                            onClick={() => setActiveTab('finances')}
                        >
                            📊 {t('finances') || 'Finanzas'}
                        </TabButton>
                    </TabNav>
                </div>

                {loading ? (
                    <Loading variant="centered" text={t('loading') || "Cargando..."} />
                ) : (
                    <div className="dashboard-grid animate-fadeIn">
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">🛠️ {t('actions') || 'Acciones'}</h3>
                                <div className="flex flex-col gap-3">
                                    {activeTab === 'list' && (
                                        <Button
                                            variant="primary"
                                            className="justify-start w-full"
                                            onClick={() => handleOpenFormModal()}
                                        >
                                            ✨ {t('new_institution') || 'Nueva Institución'}
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="justify-start w-full"
                                        onClick={() => window.location.reload()}
                                    >
                                        🔄 {t('refresh') || 'Actualizar'}
                                    </Button>
                                </div>
                            </div>
                        </aside>

                        <main className="dashboard-main">
                            <div className="dashboard-card no-padding">
                                <div className="institutions__content animate-fadeIn">
                                    {activeTab === 'list' ? (
                                        <InstitutionList
                                            institutions={institutions}
                                            onEdit={handleOpenFormModal}
                                            onDelete={handleDelete}
                                            t={t}
                                        />
                                    ) : (
                                        <InstitutionFinances institutions={institutions} t={t} />
                                    )}
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

export default Institutions;

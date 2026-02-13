
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
        <MainLayout
            title={t('institutions') || 'Instituciones'}
            subtitle={t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}
        >
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

            {loading ? (
                <Loading variant="centered" text={t('loading') || "Cargando..."} />
            ) : (
                <>
                    <header className="institutions__actions" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                        {activeTab === 'list' && (
                            <Button variant="primary" onClick={() => handleOpenFormModal()}>
                                ✨ {t('new_institution') || 'Nueva Institución'}
                            </Button>
                        )}
                    </header>

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
                </>
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
        </MainLayout>
    );
};

export default Institutions;

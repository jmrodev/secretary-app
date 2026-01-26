
import React from 'react';
import MainLayout from '../components/templates/MainLayout';
import Button from '../components/atoms/Button';
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
        handleOpenFormModal,
        handleCloseFormModal,
        handleFormSubmit,
        handleDelete,
        handleInputChange,
        t
    } = useInstitutionsController();

    return (
        <MainLayout
            title={t('institutions') || 'Instituciones'}
            subtitle={t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}
        >
            <nav className="tab-nav mb-8">
                <Button
                    variant="ghost"
                    className={`tab-nav__item ${activeTab === 'list' ? 'tab-nav__item--active' : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    📋 {t('list') || 'Listado'}
                </Button>
                <Button
                    variant="ghost"
                    className={`tab-nav__item ${activeTab === 'finances' ? 'tab-nav__item--active' : ''}`}
                    onClick={() => setActiveTab('finances')}
                >
                    📊 {t('finances') || 'Finanzas'}
                </Button>
            </nav>

            <header className="page-header__actions flex justify-end mb-4">
                {activeTab === 'list' && (
                    <Button onClick={() => handleOpenFormModal()}>
                        + {t('new_institution') || 'Nueva Institución'}
                    </Button>
                )}
            </header>

            <div className="tab-content animate-fadeIn">
                {activeTab === 'list' ? (
                    <InstitutionList
                        institutions={institutions}
                        loading={loading}
                        onEdit={handleOpenFormModal}
                        onDelete={handleDelete}
                    />
                ) : (
                    <InstitutionFinances institutions={institutions} />
                )}
            </div>

            <InstitutionFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSubmit={handleFormSubmit}
                formData={formData}
                onChange={handleInputChange}
                isEditing={!!editingInstitution}
            />
        </MainLayout>
    );
};

export default Institutions;

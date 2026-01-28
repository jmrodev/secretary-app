
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
            <nav className="institutions__nav">
                <Button
                    variant="ghost"
                    className={`tab-nav__item ${activeTab === 'list' ? 'tab-nav__item--active' : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    📋 {t('list')}
                </Button>
                <Button
                    variant="ghost"
                    className={`tab-nav__item ${activeTab === 'finances' ? 'tab-nav__item--active' : ''}`}
                    onClick={() => setActiveTab('finances')}
                >
                    📊 {t('finances')}
                </Button>
            </nav>

            <header className="institutions__actions">
                {activeTab === 'list' && (
                    <Button onClick={() => handleOpenFormModal()}>
                        + {t('new_institution')}
                    </Button>
                )}
            </header>

            <div className="institutions__content animate-fadeIn">
                {activeTab === 'list' ? (
                    <InstitutionList
                        institutions={institutions}
                        loading={loading}
                        onEdit={handleOpenFormModal}
                        onDelete={handleDelete}
                        t={t}
                    />
                ) : (
                    <InstitutionFinances institutions={institutions} t={t} />
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
        </MainLayout>
    );
};

export default Institutions;

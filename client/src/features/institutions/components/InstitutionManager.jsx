import React from 'react';
import InstitutionList from './InstitutionList';
import { InstitutionFinances } from '../../finances';
import InstitutionFormModal from './InstitutionFormModal';
import Icon from '@/components/atoms/Icon';
import TabNav from '@/components/molecules/TabNav';
import TabButton from '@/components/atoms/TabButton';
import './InstitutionManager.css';

const InstitutionManager = ({
    institutions,
    loading,
    activeTab,
    setActiveTab,
    isFormModalOpen,
    editingInstitution,
    formData,
    handlers,
    t
}) => {
    const {
        handleOpenFormModal,
        handleCloseFormModal,
        handleFormSubmit,
        handleDelete,
        handleInputChange,
    } = handlers;

    return (
        <div className="institutions-manager">
            <header className="institutions-manager__header">
                <h2 className="institutions-manager__title">{t('institutions') || 'Instituciones'}</h2>
                <p className="institutions-manager__subtitle">{t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}</p>
            </header>

            <div className="institutions-manager__nav">
                <TabNav className="institutions__nav">
                    <TabButton
                        isActive={activeTab === 'list'}
                        onClick={() => setActiveTab('list')}
                        icon={<Icon name="view_list" size="1rem" />}
                    >
                        {t('list') || 'Lista'}
                    </TabButton>
                    <TabButton
                        isActive={activeTab === 'finances'}
                        onClick={() => setActiveTab('finances')}
                        icon={<Icon name="analytics" size="1rem" />}
                    >
                        {t('finances') || 'Finanzas'}
                    </TabButton>
                </TabNav>
            </div>

            <div className="dashboard-card dashboard-card--highlighted institutions-manager__content">
                {/* Actions Header inside card */}
                {activeTab === 'list' && (
                    <div className="institutions-manager__actions">
                        <Button
                            variant="primary"
                            size="sm"
                            className="institutions-manager__action-btn"
                            onClick={() => handleOpenFormModal()}
                            icon={<Icon name="add" size="1.1rem" />}
                        >
                            {t('new_institution') || 'Nueva Institución'}
                        </Button>
                    </div>
                )}

                <div className="institutions-manager__list-container">
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

export default InstitutionManager;


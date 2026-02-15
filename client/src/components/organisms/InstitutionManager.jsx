import React from 'react';
import InstitutionList from '../components/organisms/InstitutionList';
import InstitutionFinances from '../components/organisms/InstitutionFinances';
import InstitutionFormModal from '../components/organisms/InstitutionFormModal';
import Icon from '../atoms/Icon';
import TabNav from '../molecules/TabNav';
import TabButton from '../atoms/TabButton';

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
        <div className="institutions-manager h-full flex flex-col">
            <header className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-slate-800">{t('institutions') || 'Instituciones'}</h2>
                <p className="text-slate-500">{t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}</p>
            </header>

            <div className="mb-6">
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

            <div className="flex-1 dashboard-card dashboard-card--highlighted flex flex-col overflow-hidden">
                {/* Actions Header inside card */}
                {activeTab === 'list' && (
                    <div className="flex justify-end mb-4">
                        <button
                            className="btn btn-primary btn-sm flex items-center gap-2"
                            onClick={() => handleOpenFormModal()}
                        >
                            <Icon name="add" size="1.1rem" />
                            {t('new_institution') || 'Nueva Institución'}
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
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

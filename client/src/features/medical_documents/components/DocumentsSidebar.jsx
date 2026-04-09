import React from 'react';
import TabNav from '@/components/molecules/TabNav';
import TabButton from '@/components/atoms/TabButton';
import Icon from '@/components/atoms/Icon';
import SearchBar from '@/components/molecules/SearchBar';
import Button from '@/components/atoms/Button';

/**
 * DocumentsSidebar Feature Organism.
 * Dedicated navigation and action panel for the medical_documents domain.
 * Orchestrates tab switching and quick actions (export, print) for requests and history.
 */
const DocumentsSidebar = ({
    t,
    activeTab,
    handleTabChange,
    searchTerm,
    handleSearchChange,
    requestsSubTab,
    handleExportJSON,
    handlePrintPrescriptions
}) => {
    return (
        <aside className="dashboard-sidebar animate-fadeIn">
            <div className="dashboard-nav-bar flex flex-col gap-2 p-4">
                <TabNav className="medical-documents__tabs flex flex-col gap-2">
                    {[
                        { id: 'requests', label: t('requests_workflow'), icon: 'description' },
                        { id: 'files', label: t('file_repository'), icon: 'folder_open' },
                        { id: 'prescriptions', label: t('prescriptions'), icon: 'medication' },
                        { id: 'licenses', label: t('medical_licenses'), icon: 'description' },
                        { id: 'certificates', label: t('certificates') || 'Certificados', icon: 'verified' }
                    ].map(tab => (
                        <TabButton
                            key={tab.id}
                            isActive={activeTab === tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className="w-full flex items-center p-3 rounded-sm transition-all hover:bg-gray-50"
                        >
                            <span className="medical-documents__tab-icon mr-3 text-accent font-bold">
                                <Icon name={tab.icon} size="1.2rem" />
                            </span>
                            <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                        </TabButton>
                    ))}
                </TabNav>
            </div>

            <div className="dashboard-card mt-6 p-6 bg-white border border-gray-100 shadow-sm mx-4 rounded-sm">
                <h3 className="dashboard-card__title flex items-center gap-2 mb-4 font-bold text-gray-800 border-b border-gray-50 pb-2">
                    <Icon name="search" size="1.2rem" color="var(--accent-color)" />
                    {t('search') || 'Buscar'}
                </h3>
                <SearchBar
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder={t('search_docs_placeholder')}
                    className="w-full border-gray-200"
                />
            </div>

            {activeTab === 'requests' && requestsSubTab === 'list' && (
                <div className="dashboard-card mt-6 p-6 bg-blue-50 border border-blue-100 shadow-sm mx-4 rounded-sm">
                    <h3 className="dashboard-card__title mb-4 font-bold text-blue-900 border-b border-blue-100 pb-2 flex items-center gap-2">
                        <Icon name="settings" size="1.1rem" color="var(--blue-600)" />
                        {t('actions') || 'Acciones'}
                    </h3>
                    <div className="config-flex--column config-flex--gap-3 flex flex-col gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleExportJSON}
                            icon={<Icon name="save" size="1rem" />}
                            className="w-full justify-start font-bold uppercase tracking-widest text-[10px]"
                        >
                            {t('export_json')}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrintPrescriptions}
                            icon={<Icon name="print" size="1rem" />}
                            className="w-full justify-start font-bold uppercase tracking-widest text-[10px]"
                        >
                            {t('print_backup')}
                        </Button>
                    </div>
                </div>
            )}

            {['prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                <div className="dashboard-card mt-6 p-6 bg-blue-50 border border-blue-100 shadow-sm mx-4 rounded-sm">
                    <h3 className="dashboard-card__title mb-4 font-bold text-blue-900 border-b border-blue-100 pb-2 flex items-center gap-2">
                        <Icon name="settings" size="1.1rem" color="var(--blue-600)" />
                        {t('actions') || 'Acciones'}
                    </h3>
                    <div className="config-flex--column config-flex--gap-3 flex flex-col gap-3">
                        {activeTab === 'prescriptions' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleExportJSON}
                                icon={<Icon name="save" size="1rem" />}
                                className="w-full justify-start font-bold uppercase tracking-widest text-[10px]"
                            >
                                {t('export_json')}
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrintPrescriptions}
                            icon={<Icon name="print" size="1rem" />}
                            className="w-full justify-start font-bold uppercase tracking-widest text-[10px]"
                        >
                            {t('print_backup')}
                        </Button>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default DocumentsSidebar;

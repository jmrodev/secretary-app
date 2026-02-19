import React from 'react';
import TabNav from '../molecules/TabNav';
import TabButton from '../atoms/TabButton';
import Icon from '../atoms/Icon';
import SearchBar from '../molecules/SearchBar';
import Button from '../atoms/Button';

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
        <aside className="dashboard-sidebar">
            <div className="dashboard-nav-bar">
                <TabNav className="medical-documents__tabs">
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
                        >
                            <span className="medical-documents__tab-icon">
                                <Icon name={tab.icon} size="1.2rem" />
                            </span>
                            {tab.label}
                        </TabButton>
                    ))}
                </TabNav>
            </div>

            <div className="dashboard-card">
                <h3 className="dashboard-card__title">
                    <Icon name="search" size="1.2rem" />
                    {t('search') || 'Buscar'}
                </h3>
                <SearchBar
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder={t('search_docs_placeholder')}
                />
            </div>

            {activeTab === 'requests' && requestsSubTab === 'list' && (
                <div className="dashboard-card">
                    <h3 className="dashboard-card__title">🛠️ {t('actions') || 'Acciones'}</h3>
                    <div className="config-flex--column config-flex--gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleExportJSON}
                            icon={<Icon name="save" size="1rem" />}
                            className="w-full justify-start"
                        >
                            {t('export_json')}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrintPrescriptions}
                            icon={<Icon name="PRINT" size="1rem" />}
                            className="w-full justify-start"
                        >
                            {t('print_backup')}
                        </Button>
                    </div>
                </div>
            )}

            {['prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                <div className="dashboard-card">
                    <h3 className="dashboard-card__title">🛠️ {t('actions') || 'Acciones'}</h3>
                    <div className="config-flex--column config-flex--gap-3">
                        {activeTab === 'prescriptions' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleExportJSON}
                                icon={<Icon name="save" size="1rem" />}
                                className="w-full justify-start"
                            >
                                {t('export_json')}
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrintPrescriptions}
                            icon={<Icon name="PRINT" size="1rem" />}
                            className="w-full justify-start"
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

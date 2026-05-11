import React from 'react';
import TabNav from '@/components/molecules/TabNav';
import TabButton from '@/components/atoms/TabButton';
import Icon from '@/components/atoms/Icon';
import SearchBar from '@/components/molecules/SearchBar';
import Button from '@/components/atoms/Button';
import { DoctorSelector } from '@/features/doctors';
import './DocumentsSidebar.css';

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
        <aside className="dashboard-layout__sidebar medical-documents__sidebar animate-fade-in">
            <div className="dashboard-nav-bar">
                <TabNav className="medical-documents__tabs">
                    {[
                        { id: 'requests', label: t('requests_workflow'), icon: 'description' },
                        { id: 'files', label: t('file_repository'), icon: 'folder_open' },
                        { id: 'prescriptions', label: t('prescriptions'), icon: 'medication' },
                        { id: 'licenses', label: t('medical_licenses'), icon: 'description' },
                        { id: 'certificates', label: t('certificates'), icon: 'verified' }
                    ].map(tab => (
                        <TabButton
                            key={tab.id}
                            isActive={activeTab === tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className="medical-documents__tab-button"
                        >
                            <span className="medical-documents__tab-icon">
                                <Icon name={tab.icon} size="1.2rem" />
                            </span>
                            <span className="medical-documents__tab-label">{tab.label}</span>
                        </TabButton>
                    ))}
                </TabNav>
            </div>

            <div className="dashboard-card medical-documents__doctor-card">
                <h3 className="dashboard-card__title">
                    <Icon name="medical_services" size="1.2rem" color="var(--accent-color)" />
                    {t('doctor_filter') || t('doctor_label')}
                </h3>
                <DoctorSelector />
            </div>

            <div className="dashboard-card medical-documents__search-card">
                <h3 className="dashboard-card__title">
                    <Icon name="search" size="1.2rem" color="var(--accent-color)" />
                    {t('search')}
                </h3>
                <SearchBar
                    value={searchTerm}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder={t('search_docs_placeholder')}
                    className="medical-documents__search-input"
                />
            </div>

            {activeTab === 'requests' && requestsSubTab === 'list' && (
                <div className="dashboard-card medical-documents__action-card">
                    <h3 className="dashboard-card__title medical-documents__action-title">
                        <Icon name="settings" size="1.1rem" color="var(--blue-600)" />
                        {t('actions')}
                    </h3>
                    <div className="medical-documents__action-list">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleExportJSON}
                            icon={<Icon name="save" size="1rem" />}
                            className="medical-documents__action-btn"
                        >
                            {t('export_json')}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrintPrescriptions}
                            icon={<Icon name="print" size="1rem" />}
                            className="medical-documents__action-btn"
                        >
                            {t('print_backup')}
                        </Button>
                    </div>
                </div>
            )}

            {['prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                <div className="dashboard-card medical-documents__action-card">
                    <h3 className="dashboard-card__title medical-documents__action-title">
                        <Icon name="settings" size="1.1rem" color="var(--blue-600)" />
                        {t('actions')}
                    </h3>
                    <div className="medical-documents__action-list">
                        {activeTab === 'prescriptions' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleExportJSON}
                                icon={<Icon name="save" size="1rem" />}
                                className="medical-documents__action-btn"
                            >
                                {t('export_json')}
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrintPrescriptions}
                            icon={<Icon name="print" size="1rem" />}
                            className="medical-documents__action-btn"
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

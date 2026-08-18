import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FeatureToolbar from '@/components/organisms/FeatureToolbar';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';

export const MedicalDocumentsToolbar = ({ 
    requestsSubTab, 
    handleExportJSON, 
    handlePrintPrescriptions, 
    t 
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab based on the current path
    let activeTab = 'requests'; // Default
    if (location.pathname.includes('/documents/prescriptions')) activeTab = 'prescriptions';
    else if (location.pathname.includes('/documents/licenses')) activeTab = 'licenses';
    else if (location.pathname.includes('/documents/certificates')) activeTab = 'certificates';

    const handleTabChange = (tabId) => {
        navigate(`/documents/${tabId}`);
    };

    return (
        <FeatureToolbar
            className="medical-documents-page-orchestrator__top-actions"
            tabs={[
                { id: 'requests', label: t('requests_workflow'), icon: 'description' },
                { id: 'prescriptions', label: t('prescriptions'), icon: 'medication' },
                { id: 'licenses', label: t('medical_licenses'), icon: 'description' },
                { id: 'certificates', label: t('certificates'), icon: 'verified' }
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            actions={
                ['requests', 'prescriptions', 'licenses', 'certificates'].includes(activeTab) && (
                    <>
                        {((activeTab === 'requests' && requestsSubTab === 'list') || activeTab === 'prescriptions') && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleExportJSON}
                                icon={<Icon name="save" size="1rem" />}
                            >
                                {t('export_json')}
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrintPrescriptions}
                            icon={<Icon name="print" size="1rem" />}
                        >
                            {t('print_backup')}
                        </Button>
                    </>
                )
            }
        />
    );
};

import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { MainLayout } from '@/components/templates/MainLayout';
import { MedicalDocumentsToolbar } from './components/sections/MedicalDocumentsToolbar';
import styles from './MedicalDocumentsPage.module.css';

/**
 * MedicalDocumentsPage (Layout Orchestrator).
 * Acts as the layout shell for the nested Medical Document views.
 */
export const MedicalDocumentsPage = () => {
    const { t } = useLanguage();

    // The sub-tab state for requests could be lifted here or handled via URL.
    // For now, we assume it's handled by the RequestsView or kept simple.
    // We'll pass dummy handlers to Toolbar for export/print if they are not global,
    // or you could move them to a global Context.
    
    const handleExportJSON = () => {
        console.log("Export JSON clicked");
        // Implementation can be hooked up via context or event dispatcher
    };
    
    const handlePrintPrescriptions = () => {
        console.log("Print clicked");
        // Implementation can be hooked up via context or event dispatcher
    };

    return (
        <MainLayout wide flush title={t('medical_documents')}>
            <div>
                <MedicalDocumentsToolbar 
                    requestsSubTab="list"
                    handleExportJSON={handleExportJSON}
                    handlePrintPrescriptions={handlePrintPrescriptions}
                    t={t}
                />

                <section className={`${styles.MedicalDocumentsPage__main} ${styles.MedicalDocumentsPage__noPrint}`}>
                    <div className={`${styles.MedicalDocumentsPage__tabsContent}`}>
                        <Suspense fallback={<div>Loading view…</div>}>
                            <Outlet />
                        </Suspense>
                    </div>
                </section>
            </div>
        </MainLayout>
    );
};


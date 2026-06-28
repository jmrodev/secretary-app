import React from 'react';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/hooks/useLanguage';
import MedicalRequirementManager from './components/ui/MedicalRequirementManager';
import MainLayout from '@/components/templates/MainLayout';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';

// Local Styles
import styles from './RequestsPage.module.css';

import FeatureToolbar from '@/components/organisms/FeatureToolbar';

/**
 * RequestsPage (Orchestrator).
 * Main entry point for the medical requirements workflow (Staff view).
 */
const RequestsPage = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <MainLayout wide flush>
            <div className={`${styles.requestsPageOrchestrator}`}>
                <FeatureToolbar
                    className="requests-page-orchestrator__top-actions"
                    actions={
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.location.reload()}
                            icon={<Icon name="sync" size="1.1rem" />}
                        >
                            {t('refresh') || 'Actualizar'}
                        </Button>
                    }
                />

                <div className="layout-content-area animate-fade-in">
                    <main className="dashboard-layout__main dashboard-layout__main--full">
                        <article className="dashboard-card no-padding">
                            <section className={`${styles.section}`}>
                                <MedicalRequirementManager user={user} />
                            </section>
                        </article>
                    </main>
                </div>
            </div>
        </MainLayout>
    );
};

export default RequestsPage;

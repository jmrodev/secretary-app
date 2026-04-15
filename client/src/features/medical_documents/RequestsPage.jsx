import React from 'react';
import { useAuth } from '../auth';
import { useLanguage } from '@/context/LanguageContext';
import { MedicalRequirementManager } from './index';
import MainLayout from '@/components/templates/MainLayout';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';

// Local Styles
import './RequestsPage.css';

/**
 * RequestsPage (Orchestrator).
 * Main entry point for the medical requirements workflow (Staff view).
 */
const RequestsPage = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <MainLayout wide>
            <div className="requests-page-orchestrator">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('requests_workflow') || "Solicitudes"}</h1>
                    <p className="dashboard-header__subtitle">Gestione las solicitudes de recetas, certificados y licencias médicas.</p>
                </header>

                <div className="dashboard-nav-bar animate-fadeIn">
                    <div className="requests-page__spacer"></div>
                    <div className="dashboard-nav-bar__actions requests-page__nav-actions">
                    </div>
                </div>

                <div className="dashboard-grid animate-fadeIn">
                    <aside className="dashboard-sidebar">
                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">
                                <Icon name="build" size="1.2rem" />
                                {t('actions') || 'Acciones'}
                            </h3>
                            <div className="requests-page__actions">
                                <Button
                                    variant="outline"
                                    className="requests-page__action-btn"
                                    onClick={() => window.location.reload()}
                                    icon={<Icon name="sync" size="1.1rem" />}
                                >
                                    {t('refresh') || 'Actualizar'}
                                </Button>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">
                                <Icon name="info" size="1.2rem" />
                                {t('information') || 'Información'}
                            </h3>
                             <p className="requests-page__info-text">
                                Aquí puede ver y procesar las solicitudes realizadas por los pacientes a través del portal público.
                            </p>
                        </div>
                    </aside>

                    <main className="dashboard-main">
                        <div className="dashboard-card no-padding">
                            <section className="requests-page__section">
                                <MedicalRequirementManager user={user} />
                            </section>
                        </div>
                    </main>
                </div>
            </div>
        </MainLayout>
    );

};

export default RequestsPage;

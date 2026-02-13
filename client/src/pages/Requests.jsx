
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RequirementsList from '../components/organisms/RequirementsList';
import MainLayout from '../components/templates/MainLayout';
import Icon from '../components/atoms/Icon';
import Button from '../components/atoms/Button';

/**
 * Requests Page Component.
 * Main entry point for the medical requirements workflow.
 */
const Requests = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <MainLayout wide>
            <div className="requests-page">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('requests_workflow') || "Solicitudes"}</h1>
                    <p className="dashboard-header__subtitle">Gestione las solicitudes de recetas, certificados y licencias médicas.</p>
                </header>

                <div className="dashboard-nav-bar animate-fadeIn">
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-4">
                        {/* Placeholder for future status filters if needed */}
                    </div>
                </div>

                <div className="dashboard-grid animate-fadeIn">
                    <aside className="dashboard-sidebar">
                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">🛠️ {t('actions') || 'Acciones'}</h3>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="outline"
                                    className="justify-start w-full"
                                    onClick={() => window.location.reload()}
                                    icon={<Icon name="SYNC" size="1.2rem" />}
                                >
                                    {t('refresh') || 'Actualizar'}
                                </Button>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">ℹ️ {t('information') || 'Información'}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Aquí puede ver y procesar las solicitudes realizadas por los pacientes a través del portal público.
                            </p>
                        </div>
                    </aside>

                    <main className="dashboard-main">
                        <div className="dashboard-card no-padding">
                            <section className="requests-page__section">
                                <RequirementsList user={user} />
                            </section>
                        </div>
                    </main>
                </div>
            </div>
        </MainLayout>
    );
};

export default Requests;

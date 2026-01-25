import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RequirementsList from '../components/organisms/RequirementsList';
import Sidebar from '../components/organisms/Sidebar';

/**
 * Requests Page Component.
 * Main entry point for the medical requirements workflow.
 * Uses BEM naming convention for the top-level layout.
 */
const Requests = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <div className="requests-page app-layout">
            <Sidebar />

            <main className="requests-page__content main-content">
                <header className="requests-page__header mb-8">
                    <h1 className="requests-page__title title text-2xl font-bold">
                        {t('requests_workflow')}
                    </h1>
                    <p className="requests-page__description text-slate-500">
                        Gestione las solicitudes de recetas, certificados y licencias médicas.
                    </p>
                </header>

                <section className="requests-page__section card overflow-visible">
                    <RequirementsList user={user} />
                </section>
            </main>
        </div>
    );
};

export default Requests;

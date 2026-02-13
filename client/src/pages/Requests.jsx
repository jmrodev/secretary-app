import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RequirementsList from '../components/organisms/RequirementsList';
import MainLayout from '../components/templates/MainLayout';
import './Requests.css';

/**
 * Requests Page Component.
 * Main entry point for the medical requirements workflow.
 */
const Requests = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    return (
        <MainLayout
            title={t('requests_workflow')}
            subtitle="Gestione las solicitudes de recetas, certificados y licencias médicas."
        >
            <div className="requests-page">
                <section className="requests-page__section requests-page__section--overflow-visible">
                    <RequirementsList user={user} />
                </section>
            </div>
        </MainLayout>
    );
};

export default Requests;

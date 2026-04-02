import React from 'react';

/**
 * DocumentsHeader Feature Molecule.
 * Title and subtitle section for the medical documents dashboard.
 * Part of the identity and branding of the medical_documents feature.
 */
const DocumentsHeader = ({ t }) => {
    return (
        <header className="dashboard-header animate-fadeIn mb-8">
            <h1 className="dashboard-header__title text-3xl font-extrabold text-slate-800 tracking-tight">{t('medical_documents') || 'Documentos Médicos'}</h1>
            <p className="dashboard-header__subtitle text-slate-500 font-medium mt-2 max-w-2xl leading-relaxed italic border-l-4 border-accent pl-4">
                {t('medical_docs_subtitle') || 'Orqueste requerimientos, centralice archivos clínicos y gestione el historial documental de sus pacientes en un único entorno modular.'}
            </p>
        </header>
    );
};

export default DocumentsHeader;

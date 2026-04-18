import React from 'react';

/**
 * DocumentsHeader Feature Molecule.
 * Title and subtitle section for the medical documents dashboard.
 * Part of the identity and branding of the medical_documents feature.
 */
const DocumentsHeader = ({ t }) => {
    return (
        <header className="dashboard-header animate-fadeIn">
            <h1 className="dashboard-header__title">{t('medical_documents') || 'Documentos Médicos'}</h1>
            <p className="dashboard-header__subtitle">
                {t('medical_docs_subtitle') || 'Orqueste requerimientos, centralice archivos clínicos y gestione el historial documental de sus pacientes en un único entorno modular.'}
            </p>
        </header>
    );
};

export default DocumentsHeader;

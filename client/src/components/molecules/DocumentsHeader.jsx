import React from 'react';

const DocumentsHeader = ({ t }) => {
    return (
        <header className="dashboard-header">
            <h1 className="dashboard-header__title">{t('medical_documents')}</h1>
            <p className="dashboard-header__subtitle">{t('medical_docs_subtitle') || 'Gestione requerimientos, archivos e historial de pacientes.'}</p>
        </header>
    );
};

export default DocumentsHeader;

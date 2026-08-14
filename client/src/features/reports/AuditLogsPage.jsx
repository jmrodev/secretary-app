import React from 'react';
import { useAuditLogsController } from '@/features/reports/hooks/useAuditLogsController';
import AuditLogManager from '@/features/reports/components/views/AuditLogManager';

import MainLayout from '@/components/templates/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './AuditLogsPage.module.css';

/**
 * AuditLogsPage (Orchestrator).
 * Interface for viewing and filtering system audit logs.
 */
const AuditLogsPage = () => {
    const controller = useAuditLogsController();
    const { t } = useLanguage();
    
    return (
        <MainLayout wide flush title={t('audit_logs')}>
            <main className={`${styles.auditLogsPageOrchestrator} animate-fade-in`}>
                <AuditLogManager {...controller} />
            </main>
        </MainLayout>
    );
};

export default AuditLogsPage;

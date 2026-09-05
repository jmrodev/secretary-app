import React from 'react';
import { useAuditLogsController } from '@/features/reports/hooks/useAuditLogsController';
import { AuditLogManager } from '@/features/reports/components/views/AuditLogManager';

import { MainLayout } from '@/components/templates/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * AuditLogsPage (Orchestrator).
 * Interface for viewing and filtering system audit logs.
 */
export const AuditLogsPage = () => {
    const controller = useAuditLogsController();
    const { t } = useLanguage();
    
    return (
        <MainLayout title={t('audit_logs')}>
            <section>
                <AuditLogManager {...controller} />
            </section>
        </MainLayout>
    );
};

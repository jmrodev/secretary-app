import React from 'react';
import { useAuditLogsController } from './hooks/useAuditLogsController';
import AuditLogManager from './components/AuditLogManager';

import MainLayout from '@/components/templates/MainLayout';

/**
 * AuditLogsPage (Orchestrator).
 * Interface for viewing and filtering system audit logs.
 */
const AuditLogsPage = () => {
    const controller = useAuditLogsController();
    
    return (
        <MainLayout wide>
            <div className="audit-logs-page-orchestrator animate-fadeIn">
                <AuditLogManager {...controller} />
            </div>
        </MainLayout>
    );
};

export default AuditLogsPage;

import React from 'react';
import { useAuditLogsController, AuditLogManager } from './index';

/**
 * AuditLogsPage (Orchestrator).
 * Interface for viewing and filtering system audit logs.
 */
const AuditLogsPage = () => {
    const controller = useAuditLogsController();
    
    return (
        <div className="audit-logs-page-orchestrator animate-fadeIn">
            <AuditLogManager {...controller} />
        </div>
    );
};

export default AuditLogsPage;

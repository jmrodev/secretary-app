
// Public API for the Reports Feature
// Following the Orchestrator vs. Executor pattern

// Controllers and Hooks
export { useReportsController } from './hooks/useReportsController';
export { useAuditLogsController } from './hooks/useAuditLogsController';

// Components and Dashboard
export { default as ReportsDashboard } from './components/ReportsDashboard';
export { default as ReportsPage } from './ReportsPage';
export { default as AuditLogManager } from './components/AuditLogManager';
export { default as AuditLogsPage } from './AuditLogsPage';
export { default as ReportTabs } from './components/ReportTabs';
export { default as ReportFilters } from './components/ReportFilters';

// Table Components (exported if needed separately)
export { default as AppointmentReportTable } from './components/AppointmentReportTable';
export { default as PrescriptionReportTable } from './components/PrescriptionReportTable';
export { default as LicenseReportTable } from './components/LicenseReportTable';
export { default as CertificateReportTable } from './components/CertificateReportTable';
export { default as AuditLogTable } from './components/AuditLogTable';
export { default as BalanceView } from './components/BalanceView';

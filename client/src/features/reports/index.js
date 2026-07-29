
// Public API for the Reports Feature
// Following the Orchestrator vs. Executor pattern

// Controllers and Hooks
export { useReportsController } from '@/features/reports/hooks/useReportsController';
export { useAuditLogsController } from '@/features/reports/hooks/useAuditLogsController';

// Components and Dashboard
export { default as ReportsDashboard } from '@/features/reports/components/views/ReportsDashboard';
export { default as ReportsPage } from '@/features/reports/ReportsPage';
export { default as AuditLogManager } from '@/features/reports/components/views/AuditLogManager';
export { default as AuditLogsPage } from '@/features/reports/AuditLogsPage';
export { default as ReportTabs } from '@/features/reports/components/ui/ReportTabs';
export { default as ReportFilters } from '@/features/reports/components/ui/ReportFilters';

// Table Components (exported if needed separately)
export { default as AppointmentReportTable } from '@/features/reports/components/tables/AppointmentReportTable';
export { default as PrescriptionReportTable } from '@/features/reports/components/tables/PrescriptionReportTable';
export { default as LicenseReportTable } from '@/features/reports/components/tables/LicenseReportTable';
export { default as CertificateReportTable } from '@/features/reports/components/tables/CertificateReportTable';
export { default as AuditLogTable } from '@/features/reports/components/tables/AuditLogTable';
export { default as BalanceView } from '@/features/reports/components/views/BalanceView';

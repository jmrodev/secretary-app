
// Public API for the Reports Feature
// Following the Orchestrator vs. Executor pattern

// Controllers and Hooks
export { useReportsController } from '@/features/reports/hooks/useReportsController';
export { useAuditLogsController } from '@/features/reports/hooks/useAuditLogsController';

// Components and Dashboard
export { ReportsDashboard } from '@/features/reports/components/views/ReportsDashboard';
export { ReportsPage } from '@/features/reports/ReportsPage';
export { AuditLogManager } from '@/features/reports/components/views/AuditLogManager';
export { AuditLogsPage } from '@/features/reports/AuditLogsPage';
export { ReportFilters } from '@/features/reports/components/ui/ReportFilters';

// Table Components (exported if needed separately)
export { AppointmentReportTable } from '@/features/reports/components/tables/AppointmentReportTable';
export { PrescriptionReportTable } from '@/features/reports/components/tables/PrescriptionReportTable';
export { LicenseReportTable } from '@/features/reports/components/tables/LicenseReportTable';
export { CertificateReportTable } from '@/features/reports/components/tables/CertificateReportTable';
export { AuditLogTable } from '@/features/reports/components/tables/AuditLogTable';
export { BalanceView } from '@/features/reports/components/views/BalanceView';

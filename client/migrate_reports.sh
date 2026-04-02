#!/bin/bash
BASE="src"
TARGET_COMP="\$BASE/features/reports/components"
TARGET_HOOKS="\$BASE/features/reports/hooks"
ORG="\$BASE/components/organisms"
CONT="\$BASE/controllers"

mkdir -p \$TARGET_COMP \$TARGET_HOOKS

# Move components
mv \$ORG/ReportsDashboard.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/ReportTabs.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/ReportFilters.css \$TARGET_COMP/ 2>/dev/null
mv \$ORG/ReportFilters.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/AppointmentReportTable.css \$TARGET_COMP/ 2>/dev/null
mv \$ORG/AppointmentReportTable.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/PrescriptionReportTable.css \$TARGET_COMP/ 2>/dev/null
mv \$ORG/PrescriptionReportTable.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/LicenseReportTable.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/CertificateReportTable.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/MedicalReportTable.css \$TARGET_COMP/ 2>/dev/null
mv \$ORG/ReportsView.css \$TARGET_COMP/ 2>/dev/null
mv \$ORG/BalanceView.css \$TARGET_COMP/ 2>/dev/null
mv \$ORG/BalanceView.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/AuditLogManager.jsx \$TARGET_COMP/ 2>/dev/null
mv \$ORG/AuditLogTable.jsx \$TARGET_COMP/ 2>/dev/null

# Move controllers
mv \$CONT/useReportsController.js \$TARGET_HOOKS/ 2>/dev/null
mv \$CONT/useAuditLogController.js \$TARGET_HOOKS/ 2>/dev/null

echo "MOVE_DONE"

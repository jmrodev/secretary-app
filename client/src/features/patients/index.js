
// Public API for the Patients Feature
// Following the Orchestrator vs. Executor pattern

// Main Page Component
export { PatientsPage } from '@/features/patients/PatientsPage';
export { PublicRegisterPage } from '@/features/patients/PublicRegisterPage';

// Controllers and Hooks
export { usePatientsPageController } from '@/features/patients/hooks/usePatientsPageController';
export { usePatientFormController } from '@/features/patients/hooks/usePatientFormController';
export { useMedicalRecords } from '@/features/patients/hooks/useMedicalRecords';

// Core Components (Shared within domain or needed externally)
export { PatientForm } from '@/features/patients/components/forms/PatientForm';
export { PatientManagerModal } from '@/features/patients/components/modals/PatientManagerModal';
export { PatientHistoryModal } from '@/features/patients/components/modals/PatientHistoryModal';
export { PatientDetailsView } from '@/features/patients/components/views/PatientDetailsView';
export { DebtPaymentModal } from '@/features/patients/components/modals/DebtPaymentModal';
export { PatientRecycleBin } from '@/features/patients/components/views/PatientRecycleBin';
export { QRCodeModal } from '@/features/patients/components/modals/QRCodeModal';
export { PatientSearchSelect } from '@/features/patients/components/ui/PatientSearchSelect';
export { PatientBlocker } from '@/features/patients/components/ui/PatientBlocker';

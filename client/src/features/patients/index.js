
// Public API for the Patients Feature
// Following the Orchestrator vs. Executor pattern

// Main Page Component
export { default as PatientsPage } from '@/features/patients/PatientsPage';
export { default as PublicRegisterPage } from '@/features/patients/PublicRegisterPage';

// Controllers and Hooks
export { usePatientsPageController } from '@/features/patients/hooks/usePatientsPageController';
export { usePatientFormController } from '@/features/patients/hooks/usePatientFormController';
export { useMedicalRecords } from '@/features/patients/hooks/useMedicalRecords';

// Core Components (Shared within domain or needed externally)
export { default as PatientForm } from '@/features/patients/components/PatientForm';
export { default as PatientManagerModal } from '@/features/patients/components/PatientManagerModal';
export { default as PatientHistoryModal } from '@/features/patients/components/PatientHistoryModal';
export { default as PatientDetailsView } from '@/features/patients/components/PatientDetailsView';
export { default as PatientMedications } from '@/features/patients/components/PatientMedications';
export { default as AddMedicationForm } from '@/features/patients/components/AddMedicationForm';
export { default as DebtPaymentModal } from '@/features/patients/components/DebtPaymentModal';
export { default as PatientRecycleBin } from '@/features/patients/components/PatientRecycleBin';
export { default as QRCodeModal } from '@/features/patients/components/QRCodeModal';
export { default as PatientSearchSelect } from '@/features/patients/components/PatientSearchSelect';
export { default as PatientBlocker } from '@/features/patients/components/PatientBlocker';

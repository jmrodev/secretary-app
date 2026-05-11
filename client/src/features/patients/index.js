
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
export { default as PatientForm } from '@/features/patients/components/forms/PatientForm';
export { default as PatientManagerModal } from '@/features/patients/components/modals/PatientManagerModal';
export { default as PatientHistoryModal } from '@/features/patients/components/modals/PatientHistoryModal';
export { default as PatientDetailsView } from '@/features/patients/components/views/PatientDetailsView';
export { default as PatientMedications } from '@/features/patients/components/medications/PatientMedications';
export { default as AddMedicationForm } from '@/features/patients/components/medications/AddMedicationForm';
export { default as DebtPaymentModal } from '@/features/patients/components/modals/DebtPaymentModal';
export { default as PatientRecycleBin } from '@/features/patients/components/views/PatientRecycleBin';
export { default as QRCodeModal } from '@/features/patients/components/modals/QRCodeModal';
export { default as PatientSearchSelect } from '@/features/patients/components/ui/PatientSearchSelect';
export { default as PatientBlocker } from '@/features/patients/components/ui/PatientBlocker';

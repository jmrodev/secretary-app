
// Public API for the Patients Feature
// Following the Orchestrator vs. Executor pattern

// Main Page Component
export { default as PatientsPage } from './PatientsPage';

// Controllers and Hooks
export { usePatientsPageController } from './hooks/usePatientsPageController';
export { usePatientFormController } from './hooks/usePatientFormController';
export { useMedicalRecords } from './hooks/useMedicalRecords';

// Core Components (Shared within domain or needed externally)
export { default as PatientForm } from './components/PatientForm';
export { default as PatientManagerModal } from './components/PatientManagerModal';
export { default as PatientHistoryModal } from './components/PatientHistoryModal';
export { default as PatientDetailsView } from './components/PatientDetailsView';
export { default as PatientMedications } from './components/PatientMedications';
export { default as AddMedicationForm } from './components/AddMedicationForm';
export { default as DebtPaymentModal } from './components/DebtPaymentModal';
export { default as PatientRecycleBin } from './components/PatientRecycleBin';
export { default as QRCodeModal } from './components/QRCodeModal';
export { default as PatientSearchSelect } from './components/PatientSearchSelect';
export { default as PatientBlocker } from './components/PatientBlocker';

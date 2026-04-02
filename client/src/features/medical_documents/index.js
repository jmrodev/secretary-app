
// Public API for the Medical Documents Feature
// Following the Orchestrator vs. Executor pattern

// Controllers and Hooks
export { useMedicalDocumentsController } from './hooks/useMedicalDocumentsController';
export { useMedicalRequest } from './hooks/useMedicalRequest';
export { useRequirementManagerController } from './hooks/useRequirementManagerController';

// Organisms and Orchestrators
export { default as MedicalDocumentsPage } from './MedicalDocumentsPage';
export { default as MedicalRequestForm } from './components/MedicalRequestForm';
export { default as MedicalHistoryTable } from './components/MedicalHistoryTable';
export { default as MedicalActionModals } from './components/MedicalActionModals';
export { default as MedicalRequestList } from './components/MedicalRequestList';
export { default as MedicalRequirementManager } from './components/MedicalRequirementManager';
export { default as MedicalFileRepository } from './components/MedicalFileRepository';
export { default as PrescriptionModal } from './components/PrescriptionModal';
export { default as DocumentsSidebar } from './components/DocumentsSidebar';
export { default as DocumentsHeader } from './components/DocumentsHeader';

// Molecules (if needed externally)
export { default as StatusActionModal } from './components/StatusActionModal';
export { default as DeleteFileModal } from './components/DeleteFileModal';
export { default as EditPrescriptionModal } from './components/EditPrescriptionModal';
export { default as EditLicenseModal } from './components/EditLicenseModal';
export { default as EditRequestModal } from './components/EditRequestModal';
export { default as SimpleRequestForm } from './components/SimpleRequestForm';
export { default as PrescriptionForm } from './components/PrescriptionForm';
export { default as MedicalRequirementTable } from './components/MedicalRequirementTable';
export { default as MedicalRequirementRecycleBin } from './components/MedicalRequirementRecycleBin';
export { default as MedicalRequirementDetailModal } from './components/MedicalRequirementDetailModal';
export { default as MedicalRequirementActionModal } from './components/MedicalRequirementActionModal';

// Medication Components
export { default as MedicationAutocomplete } from './components/MedicationAutocomplete';
export { default as MedicationCard } from './components/MedicationCard';
export { default as MedicationEditor } from './components/MedicationEditor';
export { default as MedicationInput } from './components/MedicationInput';
export { default as MedicationInputSection } from './components/MedicationInputSection';
export { default as MedicationList } from './components/MedicationList';
export { default as MedicationItemsSummary } from './components/MedicationItemsSummary';
export { default as HabitualMedicationsGrid } from './components/HabitualMedicationsGrid';
export { default as RequirementItem } from './components/RequirementItem';
export { default as RequirementMedicationList } from './components/RequirementMedicationList';
export { default as RequirementDetailHeader } from './components/RequirementDetailHeader';
export { default as RequirementFeedback } from './components/RequirementFeedback';

// Specialized Hooks
export { useMedicationAutocomplete } from './hooks/useMedicationAutocomplete';

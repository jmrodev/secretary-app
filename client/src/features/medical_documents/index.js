
// Public API for the Medical Documents Feature
// Following the Orchestrator vs. Executor pattern

// Controllers and Hooks
export { useMedicalDocumentsController } from '@/features/medical_documents/hooks/useMedicalDocumentsController';
export { useMedicalRequest } from '@/features/medical_documents/hooks/useMedicalRequest';
export { useRequirementManagerController } from '@/features/medical_documents/hooks/useRequirementManagerController';

// Organisms and Orchestrators
export { default as MedicalDocumentsPage } from '@/features/medical_documents/MedicalDocumentsPage';
export { default as RequestsPage } from '@/features/medical_documents/RequestsPage';
export { default as PublicRequestPage } from '@/features/medical_documents/PublicRequestPage';
export { default as MedicalRequestForm } from '@/features/medical_documents/components/forms/MedicalRequestForm';
export { default as MedicalHistoryTable } from '@/features/medical_documents/components/lists/MedicalHistoryTable';
export { default as MedicalActionModals } from '@/features/medical_documents/components/modals/MedicalActionModals';
export { default as MedicalRequestList } from '@/features/medical_documents/components/lists/MedicalRequestList';
export { default as MedicalRequirementManager } from '@/features/medical_documents/components/ui/MedicalRequirementManager';
export { default as MedicalFileRepository } from '@/features/medical_documents/components/lists/MedicalFileRepository';
export { default as PrescriptionModal } from '@/features/medical_documents/components/modals/PrescriptionModal';
export { default as DocumentsSidebar } from '@/features/medical_documents/components/sections/DocumentsSidebar';
export { default as DocumentsHeader } from '@/features/medical_documents/components/sections/DocumentsHeader';

// Molecules (if needed externally)
export { default as StatusActionModal } from '@/features/medical_documents/components/modals/StatusActionModal';
export { default as DeleteFileModal } from '@/features/medical_documents/components/modals/DeleteFileModal';
export { default as EditPrescriptionModal } from '@/features/medical_documents/components/modals/EditPrescriptionModal';
export { default as EditLicenseModal } from '@/features/medical_documents/components/modals/EditLicenseModal';
export { default as EditRequestModal } from '@/features/medical_documents/components/modals/EditRequestModal';
export { default as SimpleRequestForm } from '@/features/medical_documents/components/forms/SimpleRequestForm';
export { default as PrescriptionForm } from '@/features/medical_documents/components/forms/PrescriptionForm';
export { default as MedicalRequirementTable } from '@/features/medical_documents/components/lists/MedicalRequirementTable';
export { default as MedicalRequirementRecycleBin } from '@/features/medical_documents/components/lists/MedicalRequirementRecycleBin';
export { default as MedicalRequirementDetailModal } from '@/features/medical_documents/components/modals/MedicalRequirementDetailModal';
export { default as MedicalRequirementActionModal } from '@/features/medical_documents/components/modals/MedicalRequirementActionModal';

// Medication Components
export { default as MedicationAutocomplete } from '@/features/medical_documents/components/ui/MedicationAutocomplete';
export { default as MedicationCard } from '@/features/medical_documents/components/sections/MedicationCard';
export { default as MedicationEditor } from '@/features/medical_documents/components/forms/MedicationEditor';
export { default as MedicationInput } from '@/features/medical_documents/components/forms/MedicationInput';
export { default as MedicationInputSection } from '@/features/medical_documents/components/forms/MedicationInputSection';
export { default as MedicationList } from '@/features/medical_documents/components/lists/MedicationList';
export { default as MedicationItemsSummary } from '@/features/medical_documents/components/sections/MedicationItemsSummary';
export { default as HabitualMedicationsGrid } from '@/features/medical_documents/components/lists/HabitualMedicationsGrid';
export { default as RequirementItem } from '@/features/medical_documents/components/sections/RequirementItem';
export { default as RequirementMedicationList } from '@/features/medical_documents/components/lists/RequirementMedicationList';
export { default as RequirementDetailHeader } from '@/features/medical_documents/components/sections/RequirementDetailHeader';
export { default as RequirementFeedback } from '@/features/medical_documents/components/sections/RequirementFeedback';

// Specialized Hooks
export { useMedicationAutocomplete } from '@/features/medical_documents/hooks/useMedicationAutocomplete';

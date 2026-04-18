
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
export { default as MedicalRequestForm } from '@/features/medical_documents/components/MedicalRequestForm';
export { default as MedicalHistoryTable } from '@/features/medical_documents/components/MedicalHistoryTable';
export { default as MedicalActionModals } from '@/features/medical_documents/components/MedicalActionModals';
export { default as MedicalRequestList } from '@/features/medical_documents/components/MedicalRequestList';
export { default as MedicalRequirementManager } from '@/features/medical_documents/components/MedicalRequirementManager';
export { default as MedicalFileRepository } from '@/features/medical_documents/components/MedicalFileRepository';
export { default as PrescriptionModal } from '@/features/medical_documents/components/PrescriptionModal';
export { default as DocumentsSidebar } from '@/features/medical_documents/components/DocumentsSidebar';
export { default as DocumentsHeader } from '@/features/medical_documents/components/DocumentsHeader';

// Molecules (if needed externally)
export { default as StatusActionModal } from '@/features/medical_documents/components/StatusActionModal';
export { default as DeleteFileModal } from '@/features/medical_documents/components/DeleteFileModal';
export { default as EditPrescriptionModal } from '@/features/medical_documents/components/EditPrescriptionModal';
export { default as EditLicenseModal } from '@/features/medical_documents/components/EditLicenseModal';
export { default as EditRequestModal } from '@/features/medical_documents/components/EditRequestModal';
export { default as SimpleRequestForm } from '@/features/medical_documents/components/SimpleRequestForm';
export { default as PrescriptionForm } from '@/features/medical_documents/components/PrescriptionForm';
export { default as MedicalRequirementTable } from '@/features/medical_documents/components/MedicalRequirementTable';
export { default as MedicalRequirementRecycleBin } from '@/features/medical_documents/components/MedicalRequirementRecycleBin';
export { default as MedicalRequirementDetailModal } from '@/features/medical_documents/components/MedicalRequirementDetailModal';
export { default as MedicalRequirementActionModal } from '@/features/medical_documents/components/MedicalRequirementActionModal';

// Medication Components
export { default as MedicationAutocomplete } from '@/features/medical_documents/components/MedicationAutocomplete';
export { default as MedicationCard } from '@/features/medical_documents/components/MedicationCard';
export { default as MedicationEditor } from '@/features/medical_documents/components/MedicationEditor';
export { default as MedicationInput } from '@/features/medical_documents/components/MedicationInput';
export { default as MedicationInputSection } from '@/features/medical_documents/components/MedicationInputSection';
export { default as MedicationList } from '@/features/medical_documents/components/MedicationList';
export { default as MedicationItemsSummary } from '@/features/medical_documents/components/MedicationItemsSummary';
export { default as HabitualMedicationsGrid } from '@/features/medical_documents/components/HabitualMedicationsGrid';
export { default as RequirementItem } from '@/features/medical_documents/components/RequirementItem';
export { default as RequirementMedicationList } from '@/features/medical_documents/components/RequirementMedicationList';
export { default as RequirementDetailHeader } from '@/features/medical_documents/components/RequirementDetailHeader';
export { default as RequirementFeedback } from '@/features/medical_documents/components/RequirementFeedback';

// Specialized Hooks
export { useMedicationAutocomplete } from '@/features/medical_documents/hooks/useMedicationAutocomplete';

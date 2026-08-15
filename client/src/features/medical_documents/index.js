
// Public API for the Medical Documents Feature
// Following the Orchestrator vs. Executor pattern

// Controllers and Hooks
export { useMedicalRequest } from '@/features/medical_documents/hooks/useMedicalRequest';
export { useRequirementManagerController } from '@/features/medical_documents/hooks/useRequirementManagerController';

// Organisms and Orchestrators
export { MedicalDocumentsPage } from '@/features/medical_documents/MedicalDocumentsPage';
export { RequestsPage } from '@/features/medical_documents/RequestsPage';
export { PublicRequestPage } from '@/features/medical_documents/PublicRequestPage';
export { MedicalRequestForm } from '@/features/medical_documents/components/forms/MedicalRequestForm';
export { MedicalHistoryTable } from '@/features/medical_documents/components/lists/MedicalHistoryTable';

export { MedicalRequestList } from '@/features/medical_documents/components/lists/MedicalRequestList';
export { MedicalRequirementManager } from '@/features/medical_documents/components/ui/MedicalRequirementManager';
export { PrescriptionModal } from '@/features/medical_documents/components/modals/PrescriptionModal';

// Molecules (if needed externally)
export { StatusActionModal } from '@/features/medical_documents/components/modals/StatusActionModal';
export { EditPrescriptionModal } from '@/features/medical_documents/components/modals/EditPrescriptionModal';
export { EditLicenseModal } from '@/features/medical_documents/components/modals/EditLicenseModal';
export { EditRequestModal } from '@/features/medical_documents/components/modals/EditRequestModal';
export { SimpleRequestForm } from '@/features/medical_documents/components/forms/SimpleRequestForm';
export { PrescriptionForm } from '@/features/medical_documents/components/forms/PrescriptionForm';
export { MedicalRequirementTable } from '@/features/medical_documents/components/lists/MedicalRequirementTable';
export { MedicalRequirementRecycleBin } from '@/features/medical_documents/components/lists/MedicalRequirementRecycleBin';
export { MedicalRequirementDetailModal } from '@/features/medical_documents/components/modals/MedicalRequirementDetailModal';
export { MedicalRequirementActionModal } from '@/features/medical_documents/components/modals/MedicalRequirementActionModal';

// Medication Components
export { MedicationAutocomplete } from '@/features/medical_documents/components/ui/MedicationAutocomplete';
export { MedicationCard } from '@/features/medical_documents/components/sections/MedicationCard';
export { MedicationEditor } from '@/features/medical_documents/components/forms/MedicationEditor';
export { MedicationInput } from '@/features/medical_documents/components/forms/MedicationInput';
export { MedicationInputSection } from '@/features/medical_documents/components/forms/MedicationInputSection';
export { MedicationList } from '@/features/medical_documents/components/lists/MedicationList';
export { MedicationItemsSummary } from '@/features/medical_documents/components/sections/MedicationItemsSummary';
export { HabitualMedicationsGrid } from '@/features/medical_documents/components/lists/HabitualMedicationsGrid';
export { RequirementItem } from '@/features/medical_documents/components/sections/RequirementItem';
export { RequirementMedicationList } from '@/features/medical_documents/components/lists/RequirementMedicationList';
export { RequirementDetailHeader } from '@/features/medical_documents/components/sections/RequirementDetailHeader';
export { RequirementFeedback } from '@/features/medical_documents/components/sections/RequirementFeedback';

// Specialized Hooks
export { useMedicationAutocomplete } from '@/features/medical_documents/hooks/useMedicationAutocomplete';

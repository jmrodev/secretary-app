
// Public API for the Medical Documents Feature
// Following the Orchestrator vs. Executor pattern

// Controllers and Hooks
export { useMedicalDocumentsController } from './hooks/useMedicalDocumentsController';
export { useMedicalRequest } from './hooks/useMedicalRequest';

// Organisms and Orchestrators
export { default as MedicalRequestForm } from './components/MedicalRequestForm';
export { default as MedicalHistoryTable } from './components/MedicalHistoryTable';
export { default as MedicalActionModals } from './components/MedicalActionModals';
export { default as MedicalRequestList } from './components/MedicalRequestList';
export { default as MedicalFileRepository } from './components/MedicalFileRepository';
export { default as PrescriptionModal } from './components/PrescriptionModal';

// Molecules (if needed externally)
export { default as StatusActionModal } from './components/StatusActionModal';
export { default as DeleteFileModal } from './components/DeleteFileModal';
export { default as EditPrescriptionModal } from './components/EditPrescriptionModal';
export { default as EditLicenseModal } from './components/EditLicenseModal';
export { default as EditRequestModal } from './components/EditRequestModal';
export { default as SimpleRequestForm } from './components/SimpleRequestForm';
export { default as PrescriptionForm } from './components/PrescriptionForm';

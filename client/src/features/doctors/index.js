// src/features/doctors/index.js
export { default as DoctorsPage } from '@/features/doctors/DoctorsPage';

export { useDoctorsPageController } from '@/features/doctors/hooks/useDoctorsPageController';
export { useDoctorFiscalController } from '@/features/doctors/hooks/useDoctorFiscalController';

export { default as DoctorsManager } from '@/features/doctors/components/views/DoctorsManager';
export { default as DoctorEditModal } from '@/features/doctors/components/modals/DoctorEditModal';
export { default as DoctorScheduleSettings } from '@/features/doctors/components/sections/DoctorScheduleSettings';
export { default as DoctorCard } from '@/features/doctors/components/cards/DoctorCard';
export { default as DoctorSelector } from '@/features/doctors/components/ui/DoctorSelector';
export { default as DoctorFiscalSettings } from '@/features/doctors/components/sections/DoctorFiscalSettings';
export { default as DoctorGoogleSettings } from '@/features/doctors/components/sections/DoctorGoogleSettings';
export { default as DoctorMessagesForm } from '@/features/doctors/components/sections/DoctorMessagesForm';
export { default as DoctorTariffsForm } from '@/features/doctors/components/sections/DoctorTariffsForm';

#!/bin/bash
# migrate_doctors.sh
# Mueve los archivos del dominio Doctors a la nueva estructura de features

echo "Creando directorios para features/doctors..."
mkdir -p src/features/doctors/components
mkdir -p src/features/doctors/hooks

echo "Moviendo Hooks / Controllers..."
mv src/controllers/useDoctorsPageController.js src/features/doctors/hooks/
mv src/controllers/useDoctorFiscalController.js src/features/doctors/hooks/

echo "Moviendo Organismos..."
mv src/components/organisms/DoctorEditModal.css src/features/doctors/components/
mv src/components/organisms/DoctorEditModal.jsx src/features/doctors/components/
mv src/components/organisms/DoctorScheduleSettings.css src/features/doctors/components/
mv src/components/organisms/DoctorScheduleSettings.jsx src/features/doctors/components/
mv src/components/organisms/DoctorsManager.jsx src/features/doctors/components/
[ -f src/components/organisms/DoctorsInfo.css ] && mv src/components/organisms/DoctorsInfo.css src/features/doctors/components/

echo "Moviendo Moléculas..."
mv src/components/molecules/DoctorCard.css src/features/doctors/components/
mv src/components/molecules/DoctorCard.jsx src/features/doctors/components/
mv src/components/molecules/DoctorFilter.css src/features/doctors/components/
mv src/components/molecules/DoctorFilter.jsx src/features/doctors/components/
mv src/components/molecules/DoctorFiscalSettings.css src/features/doctors/components/
mv src/components/molecules/DoctorFiscalSettings.jsx src/features/doctors/components/
mv src/components/molecules/DoctorGoogleSettings.css src/features/doctors/components/
mv src/components/molecules/DoctorGoogleSettings.jsx src/features/doctors/components/
mv src/components/molecules/DoctorMessagesForm.css src/features/doctors/components/
mv src/components/molecules/DoctorMessagesForm.jsx src/features/doctors/components/
mv src/components/molecules/DoctorTariffsForm.css src/features/doctors/components/
mv src/components/molecules/DoctorTariffsForm.jsx src/features/doctors/components/

echo "Estructura migrada con éxito."

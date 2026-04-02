#!/bin/bash
# migrate_institutions.sh
# Mueve los archivos del dominio Institutions a la nueva estructura de features

echo "Creando directorios para features/institutions..."
mkdir -p src/features/institutions/components
mkdir -p src/features/institutions/hooks

echo "Moviendo archivos..."
mv src/controllers/useInstitutionsController.js src/features/institutions/hooks/
mv src/components/organisms/InstitutionManager.jsx src/features/institutions/components/
mv src/components/organisms/InstitutionForm.jsx src/features/institutions/components/
mv src/components/organisms/InstitutionFormModal.jsx src/features/institutions/components/
mv src/components/organisms/InstitutionList.jsx src/features/institutions/components/
mv src/components/organisms/InstitutionList.css src/features/institutions/components/

echo "Estructura principal migrada."

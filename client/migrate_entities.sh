#!/bin/bash
# migrate_entities.sh
# Mueve los archivos de Institutions e Insurances a la estructura de features

echo "Creando directorios para features/institutions y features/insurances..."
mkdir -p src/features/institutions/components
mkdir -p src/features/institutions/hooks
mkdir -p src/features/insurances/components
mkdir -p src/features/insurances/hooks

echo "Moviendo archivos de Institutions..."
mv src/controllers/useInstitutionsController.js src/features/institutions/hooks/
mv src/components/organisms/InstitutionManager.jsx src/features/institutions/components/
mv src/components/organisms/InstitutionForm.jsx src/features/institutions/components/
mv src/components/organisms/InstitutionFormModal.jsx src/features/institutions/components/
mv src/components/organisms/InstitutionList.jsx src/features/institutions/components/
mv src/components/organisms/InstitutionList.css src/features/institutions/components/

echo "Moviendo archivos de Insurances..."
mv src/controllers/useInsurancesController.js src/features/insurances/hooks/
mv src/components/organisms/InsuranceFormModal.jsx src/features/insurances/components/
mv src/components/organisms/InsuranceFormModal.css src/features/insurances/components/
mv src/components/organisms/InsuranceList.jsx src/features/insurances/components/
mv src/components/organisms/InsuranceList.css src/features/insurances/components/

echo "Moviendo archivos residuales de Finanzas Institucionales..."
mv src/components/molecules/InstitutionTransactionsTable.jsx src/features/finances/components/
mv src/components/molecules/InstitutionPatientsTable.jsx src/features/finances/components/
mv src/components/molecules/InstitutionSummary.jsx src/features/finances/components/
mv src/components/molecules/InstitutionPaymentModal.jsx src/features/finances/components/

echo "Estructura migrada con éxito."

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = '/home/jmro/secretary-app/client/src';

const filesToMigrate = [
    'features/medical_documents/MedicalDocumentsPage.jsx',
    'features/medical_documents/PublicRequestPage.jsx',
    'features/medical_documents/RequestsPage.jsx',
    'features/medical_documents/components/forms/MedicalRequestForm.jsx',
    'features/medical_documents/components/forms/MedicationEditor.jsx',
    'features/medical_documents/components/forms/MedicationInput.jsx',
    'features/medical_documents/components/forms/MedicationInputSection.jsx',
    'features/medical_documents/components/forms/PrescriptionForm.jsx',
    'features/medical_documents/components/forms/SimpleRequestForm.jsx',
    'features/medical_documents/components/lists/HabitualMedicationsGrid.jsx',
    'features/medical_documents/components/lists/MedicalHistoryTable.jsx',
    'features/medical_documents/components/lists/MedicalRequestList.jsx',
    'features/medical_documents/components/lists/MedicalRequirementRecycleBin.jsx',
    'features/medical_documents/components/lists/MedicalRequirementTable.jsx',
    'features/medical_documents/components/lists/MedicationList.jsx',
    'features/medical_documents/components/lists/PrescriptionItemsList.jsx',
    'features/medical_documents/components/lists/RequirementMedicationList.jsx',
    'features/medical_documents/components/modals/EditLicenseModal.jsx',
    'features/medical_documents/components/modals/EditPrescriptionModal.jsx',
    'features/medical_documents/components/modals/EditRequestModal.jsx',
    'features/medical_documents/components/modals/MedicalRequestModal.jsx',
    'features/medical_documents/components/modals/MedicalRequirementActionModal.jsx',
    'features/medical_documents/components/modals/MedicalRequirementDetailModal.jsx',
    'features/medical_documents/components/modals/PrescriptionModal.jsx',
    'features/medical_documents/components/modals/StatusActionModal.jsx',
    'features/medical_documents/components/sections/MedicationCard.jsx',
    'features/medical_documents/components/sections/MedicationItemsSummary.jsx',
    'features/medical_documents/components/sections/PrescriptionExtraFields.jsx',
    'features/medical_documents/components/sections/PrescriptionHabitualMeds.jsx',
    'features/medical_documents/components/sections/RequirementDetailHeader.jsx',
    'features/medical_documents/components/sections/RequirementFeedback.jsx',
    'features/medical_documents/components/sections/RequirementItem.jsx',
    'features/medical_documents/components/ui/MedicalDocumentsPrintView.jsx',
    'features/medical_documents/components/ui/MedicalRequirementManager.jsx',
    'features/medical_documents/components/ui/MedicationAutocomplete.jsx',
    'features/medical_documents/pages/CertificatesView.jsx',
    'features/medical_documents/pages/LicensesView.jsx',
    'features/medical_documents/pages/PrescriptionsView.jsx',
    'features/medical_documents/pages/RequestsView.jsx'
];

// 1. Process files and change to named exports
filesToMigrate.forEach(relPath => {
    const fullPath = path.join(rootDir, relPath);
    let content = fs.readFileSync(fullPath, 'utf8');
    const compName = path.basename(relPath, '.jsx');
    
    const constRegex = new RegExp(`^const\\s+${compName}\\s*=`, 'm');
    const letRegex = new RegExp(`^let\\s+${compName}\\s*=`, 'm');
    const funcRegex = new RegExp(`^function\\s+${compName}\\s*\\(`, 'm');
    
    if (constRegex.test(content)) {
        content = content.replace(constRegex, `export const ${compName} =`);
    } else if (letRegex.test(content)) {
        content = content.replace(letRegex, `export let ${compName} =`);
    } else if (funcRegex.test(content)) {
        content = content.replace(funcRegex, `export function ${compName}(`);
    } else {
        console.warn('Could not find declaration for', compName, 'in', fullPath);
    }
    
    // Check for export default React.memo(...)
    const defaultMemoRegex = new RegExp(`^export\\s+default\\s+(?:React\\.)?memo\\(${compName}\\);\\s*$`, 'm');
    if (defaultMemoRegex.test(content)) {
        content = content.replace(`export const ${compName} =`, `const ${compName} =`);
        content = content.replace(defaultMemoRegex, `export const ${compName} = React.memo(${compName}Base);`);
        content = content.replace(new RegExp(`const\\s+${compName}\\s*=`, 'm'), `const ${compName}Base =`);
    } else {
        const defaultExportRegex = new RegExp(`^export\\s+default\\s+${compName};\\s*$`, 'm');
        content = content.replace(defaultExportRegex, '');
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Migrated export in', relPath);
});

// 2. Fix index.js files doing `export { default as X } from ...`
const indexJsFiles = execSync(`find ${rootDir} -name index.js`).toString().split('\n').filter(Boolean);
indexJsFiles.forEach(fullPath => {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    filesToMigrate.forEach(relPath => {
        const compName = path.basename(relPath, '.jsx');
        const defaultRegex = new RegExp(`export\\s+\\{\\s*default\\s+as\\s+${compName}\\s*\\}\\s+from`, 'g');
        if (defaultRegex.test(content)) {
            content = content.replace(defaultRegex, `export { ${compName} } from`);
            changed = true;
        }
    });
    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Migrated index.js export for', fullPath);
    }
});

// 3. Fix importers: `import X from '...'` to `import { X } from '...'`
const allFiles = execSync(`find ${rootDir} -name "*.js" -o -name "*.jsx"`).toString().split('\n').filter(Boolean);
allFiles.forEach(fullPath => {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    filesToMigrate.forEach(relPath => {
        const compName = path.basename(relPath, '.jsx');
        // Match `import CompName from '...';`
        const importRegex = new RegExp(`^import\\s+${compName}\\s+from\\s+['"](.+?)['"];?`, 'gm');
        if (importRegex.test(content)) {
            content = content.replace(importRegex, `import { ${compName} } from '$1';`);
            changed = true;
        }
    });
    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Migrated importer:', fullPath);
    }
});

// 4. AppRouter lazy imports
const routerPath = path.join(rootDir, 'routes/AppRouter.jsx');
if (fs.existsSync(routerPath)) {
    let routerContent = fs.readFileSync(routerPath, 'utf8');
    let changed = false;
    filesToMigrate.forEach(relPath => {
        const compName = path.basename(relPath, '.jsx');
        const lazyRegex = new RegExp(`lazy\\(\\(\\) => import\\(['"]([^'"]+)['"]\\)\\)`, 'g');
        routerContent = routerContent.replace(lazyRegex, (match, importPath) => {
            if ((compName === 'MedicalDocumentsPage' || compName === 'PublicRequestPage' || compName === 'RequestsPage') && importPath.includes('medical_documents')) {
                changed = true;
                return `lazy(() => import('${importPath}').then(module => ({ default: module.${compName} })))`;
            }
            return match;
        });
    });
    if (changed) {
        fs.writeFileSync(routerPath, routerContent, 'utf8');
        console.log('Migrated AppRouter.jsx');
    }
}

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = '/home/jmro/secretary-app/client/src';

const filesToMigrate = [
    'features/patients/PatientsPage.jsx',
    'features/patients/PublicRegisterPage.jsx',
    'features/patients/components/forms/PatientAccountFields.jsx',
    'features/patients/components/forms/PatientAddressFields.jsx',
    'features/patients/components/forms/PatientAdminFields.jsx',
    'features/patients/components/forms/PatientContactFields.jsx',
    'features/patients/components/forms/PatientForm.jsx',
    'features/patients/components/forms/PatientIdentityFields.jsx',
    'features/patients/components/forms/PatientInsuranceFields.jsx',
    'features/patients/components/forms/PatientMedicalNotes.jsx',
    'features/patients/components/modals/DebtPaymentModal.jsx',
    'features/patients/components/modals/PatientHistoryModal.jsx',
    'features/patients/components/modals/PatientManagerModal.jsx',
    'features/patients/components/modals/QRCodeModal.jsx',
    'features/patients/components/ui/PatientBlocker.jsx',
    'features/patients/components/ui/PatientSearchSelect.jsx',
    'features/patients/components/views/PatientDetailsView.jsx',
    'features/patients/components/views/PatientFinancialSidebar.jsx',
    'features/patients/components/views/PatientHistoryTable.jsx',
    'features/patients/components/views/PatientInfoBlock.jsx',
    'features/patients/components/views/PatientList.jsx',
    'features/patients/components/views/PatientPrintableView.jsx',
    'features/patients/components/views/PatientRecycleBin.jsx',
    'features/patients/components/views/WhatsappChatHistory.jsx'
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
    const defaultMemoRegex = new RegExp(`^export\\s+default\\s+React\\.memo\\(${compName}\\);\\s*$`, 'm');
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
            if ((compName === 'PatientsPage' || compName === 'PublicRegisterPage') && importPath.includes('patients')) {
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

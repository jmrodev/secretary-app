const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = '/home/jmro/secretary-app/client/src';

const filesToMigrate = [
    'features/finances/FinancesPage.jsx',
    'features/finances/components/FinanceModalOrchestrator.jsx',
    'features/finances/components/modals/CashBalancingModal.jsx',
    'features/finances/components/modals/CashBoxDeliveryModal.jsx',
    'features/finances/components/modals/EditTransactionModal.jsx',
    'features/finances/components/modals/HistoricalWithdrawalModal.jsx',
    'features/finances/components/modals/InstitutionPaymentModal.jsx',
    'features/finances/components/modals/PendingClosuresModal.jsx',
    'features/finances/components/modals/TransactionModal.jsx',
    'features/finances/components/sections/BalanceFinancialSummary.jsx',
    'features/finances/components/sections/CashBoxSummary.jsx',
    'features/finances/components/sections/FinanceStatsCards.jsx',
    'features/finances/components/sections/InstitutionFinances.jsx',
    'features/finances/components/sections/InstitutionSummary.jsx',
    'features/finances/components/sections/InvoiceDetailContent.jsx',
    'features/finances/components/tables/BalanceCashFlowTable.jsx',
    'features/finances/components/tables/BalanceDebtsTable.jsx',
    'features/finances/components/tables/InstitutionPatientsTable.jsx',
    'features/finances/components/tables/InstitutionTransactionsTable.jsx',
    'features/finances/components/tables/TransactionRow.jsx',
    'features/finances/components/tables/TransactionsTable.jsx',
    'features/finances/components/ui/FinanceFilters.jsx',
    'features/finances/components/ui/FinanceSidebar.jsx'
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
        // We have `const CompName = ...` and `export default React.memo(CompName)`.
        // To fix this: `export const CompNameMemo = React.memo(CompName);` or rename the inner.
        // Easiest is to keep `export const CompName` if it's not a memo, but if we need memo:
        // Actually atomic design is better to just do `export const CompName = React.memo(...)` originally.
        // Let's just do a string replacement for `export const CompName =` -> `const CompName =` and then
        // `export default React.memo(CompName)` -> `export const CompNameMemo = React.memo(CompName)`
        // Wait, other places import `CompName`. Let's just do:
        content = content.replace(`export const ${compName} =`, `const ${compName} =`);
        content = content.replace(defaultMemoRegex, `export const ${compName} = React.memo(_${compName});`);
        content = content.replace(new RegExp(`const\\s+${compName}\\s*=`, 'm'), `const _${compName} =`);
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
            if (compName === 'FinancesPage' && importPath.includes('finances')) {
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

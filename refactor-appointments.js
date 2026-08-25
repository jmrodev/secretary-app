const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = '/home/jmro/secretary-app/client/src';

const filesToMigrate = [
    'features/appointments/AppointmentsPage.jsx',
    'features/appointments/components/calendar/Calendar.jsx',
    'features/appointments/components/calendar/CalendarDayCell.jsx',
    'features/appointments/components/calendar/CalendarGrid.jsx',
    'features/appointments/components/calendar/CalendarHeader.jsx',
    'features/appointments/components/calendar/CalendarSection.jsx',
    'features/appointments/components/calendar/v2/DayCell.jsx',
    'features/appointments/components/calendar/v2/DayCellPlayground.jsx',
    'features/appointments/components/calendar/v2/atoms/AppointmentsBadge.jsx',
    'features/appointments/components/calendar/v2/atoms/DayNumber.jsx',
    'features/appointments/components/calendar/v2/atoms/HolidayBadge.jsx',
    'features/appointments/components/calendar/v2/atoms/StatusDot.jsx',
    'features/appointments/components/cards/AppointmentCard.jsx',
    'features/appointments/components/forms/AppointmentTypeSelector.jsx',
    'features/appointments/components/forms/HolidayForm.jsx',
    'features/appointments/components/modals/AppointmentActionModal.jsx',
    'features/appointments/components/modals/AppointmentFormModal.jsx',
    'features/appointments/components/modals/NextSlotCalendarModal.jsx',
    'features/appointments/components/modals/NextSlotModal.jsx',
    'features/appointments/components/schedule/DayHeaders.jsx',
    'features/appointments/components/schedule/DaySchedule.jsx',
    'features/appointments/components/schedule/DayScheduleHeader.jsx',
    'features/appointments/components/schedule/ScheduleBulkActions.jsx',
    'features/appointments/components/schedule/ScheduleSection.jsx',
    'features/appointments/components/schedule/ScheduleTimeBlock.jsx',
    'features/appointments/components/schedule/ScheduleTimeline.jsx',
    'features/appointments/components/sections/AppointmentAdminPanel.jsx',
    'features/appointments/components/sections/AppointmentFormHeader.jsx',
    'features/appointments/components/sections/AppointmentHeader.jsx',
    'features/appointments/components/sections/AppointmentMedicalPanel.jsx',
    'features/appointments/components/sections/AppointmentPatientSection.jsx',
    'features/appointments/components/sections/HolidayList.jsx',
    'features/appointments/components/ui/AppointmentSyncAlert.jsx',
    'features/appointments/components/ui/RescheduleBanner.jsx',
    'features/appointments/components/ui/SlotExplorerDropdown.jsx',
    'features/appointments/components/views/PatientHistoryView.jsx'
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
            if ((compName === 'AppointmentsPage') && importPath.includes('appointments')) {
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

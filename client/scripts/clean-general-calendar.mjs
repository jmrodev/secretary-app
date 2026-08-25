import fs from 'node:fs';

// 1. Update es/calendar.js
fs.writeFileSync('./client/src/constants/languages/es/calendar.js', `export const calendar = {
    // Calendar
    days_short_array: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    months_short_array: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    days_array: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    months_array: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    export_json: "Exportar JSON",
    print_backup: "Imprimir Respaldo",
    prescription_backup: "Respaldo de Recetas",
};
`);

// 2. Update en/calendar.js
fs.writeFileSync('./client/src/constants/languages/en/calendar.js', `export const calendar = {
    // Calendar
    days_short_array: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months_short_array: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    days_array: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months_array: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    export_json: "Export JSON",
    print_backup: "Print Backup",
    prescription_backup: "Prescription Backup",
};
`);

// 3. Remove array keys from es/general.js and en/general.js
const arrayKeys = ['days_short_array', 'months_short_array', 'days_array', 'months_array'];

let esGen = fs.readFileSync('./client/src/constants/languages/es/general.js', 'utf8');
let enGen = fs.readFileSync('./client/src/constants/languages/en/general.js', 'utf8');

for (const k of arrayKeys) {
    const reg = new RegExp(`\\s*${k}:\\s*\\[[^\\]]*\\],?`, 'g');
    esGen = esGen.replace(reg, '');
    enGen = enGen.replace(reg, '');
}

fs.writeFileSync('./client/src/constants/languages/es/general.js', esGen, 'utf8');
fs.writeFileSync('./client/src/constants/languages/en/general.js', enGen, 'utf8');

console.log('Calendar and General files cleaned up.');

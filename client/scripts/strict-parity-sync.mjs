import fs from 'node:fs';
import { es } from '../src/constants/languages/es.js';
import { en } from '../src/constants/languages/en.js';

const esKeys = Object.keys(es);
const enKeys = Object.keys(en);

const missingInEn = esKeys.filter(k => !(k in en));
const missingInEs = enKeys.filter(k => !(k in es));

console.log('Missing in EN:', missingInEn);
console.log('Missing in ES:', missingInEs);

// Read files
const esGenPath = './client/src/constants/languages/es/general.js';
const enGenPath = './client/src/constants/languages/en/general.js';

let esGen = fs.readFileSync(esGenPath, 'utf8');
let enGen = fs.readFileSync(enGenPath, 'utf8');

const fallbackEn = {
    description: "Description",
    go: "Go",
    medication_placeholder: "Medication name...",
    notes: "Notes",
    schedule: "Schedule",
    today: "Today",
    view: "View",
    balance: "Balance",
    config: "Settings",
    day: "Day",
    year: "Year",
    name: "Name",
    pending_debt: "Pending debt"
};

const fallbackEs = {
    name: "Nombre",
    pending_debt: "Deuda pendiente",
    balance: "Balance",
    config: "Configuración",
    day: "Día",
    year: "Año"
};

const toAddEn = missingInEn.map(k => `    ${k}: ${JSON.stringify(fallbackEn[k] || es[k])},`).join('\n');
const toAddEs = missingInEs.map(k => `    ${k}: ${JSON.stringify(fallbackEs[k] || en[k])},`).join('\n');

if (toAddEn.length > 0) {
    enGen = enGen.replace(/};\s*$/, `\n    // Strict parity additions\n${toAddEn}\n};\n`);
    fs.writeFileSync(enGenPath, enGen, 'utf8');
    console.log('Appended missing to EN');
}

if (toAddEs.length > 0) {
    esGen = esGen.replace(/};\s*$/, `\n    // Strict parity additions\n${toAddEs}\n};\n`);
    fs.writeFileSync(esGenPath, esGen, 'utf8');
    console.log('Appended missing to ES');
}

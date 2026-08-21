import fs from 'node:fs';
import { general as esGen } from '../src/constants/languages/es/general.js';
import { general as enGen } from '../src/constants/languages/en/general.js';

const esKeys = Object.keys(esGen);
const enKeys = Object.keys(enGen);

const missingInEn = esKeys.filter(k => !(k in enGen));
const missingInEs = enKeys.filter(k => !(k in esGen));

console.log('Missing in EN count:', missingInEn.length);
console.log('Missing in ES count:', missingInEs.length);

const esPath = './client/src/constants/languages/es/general.js';
const enPath = './client/src/constants/languages/en/general.js';

let esContent = fs.readFileSync(esPath, 'utf8');
let enContent = fs.readFileSync(enPath, 'utf8');

// For keys in es missing in en:
if (missingInEn.length > 0) {
    const additions = missingInEn.map(k => `    ${k}: ${JSON.stringify(esGen[k])},`).join('\n');
    enContent = enContent.replace(/};\s*$/, `\n    // Equalized from ES\n${additions}\n};\n`);
    fs.writeFileSync(enPath, enContent, 'utf8');
}

// For keys in en missing in es:
if (missingInEs.length > 0) {
    const additions = missingInEs.map(k => `    ${k}: ${JSON.stringify(enGen[k])},`).join('\n');
    esContent = esContent.replace(/};\s*$/, `\n    // Equalized from EN\n${additions}\n};\n`);
    fs.writeFileSync(esPath, esContent, 'utf8');
}

console.log('Equalization done.');

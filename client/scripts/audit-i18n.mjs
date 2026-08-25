import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../src');

// Import translation aggregates
import { es } from '../src/constants/languages/es.js';
import { en } from '../src/constants/languages/en.js';

const esKeys = new Set(Object.keys(es));
const enKeys = new Set(Object.keys(en));

console.log(`\n================ i18n Audit Report ================`);
console.log(`Total ES dictionary keys: ${esKeys.size}`);
console.log(`Total EN dictionary keys: ${enKeys.size}`);

// 1. Check ES vs EN parity
const inEsNotEn = [...esKeys].filter(k => !enKeys.has(k)).sort();
const inEnNotEs = [...enKeys].filter(k => !esKeys.has(k)).sort();

console.log(`\n--- Dictionary Parity ---`);
console.log(`Keys in ES missing in EN (${inEsNotEn.length}):`, inEsNotEn);
console.log(`\nKeys in EN missing in ES (${inEnNotEs.length}):`, inEnNotEs);

// 2. Scan source code for t('key') and t("key")
const codeKeys = new Set();
const keyRegex = /\bt\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*[,)]/g;

function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'constants') {
                scanDir(fullPath);
            }
        } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
            if (!entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                let match;
                while ((match = keyRegex.exec(content)) !== null) {
                    codeKeys.add(match[1]);
                }
            }
        }
    }
}

scanDir(rootDir);

console.log(`\n--- Code Usages ---`);
console.log(`Unique t('key') calls found in source code: ${codeKeys.size}`);

const usedMissingInEs = [...codeKeys].filter(k => !esKeys.has(k)).sort();
const usedMissingInEn = [...codeKeys].filter(k => !enKeys.has(k)).sort();

console.log(`\nKeys used in code missing in ES (${usedMissingInEs.length}):`, usedMissingInEs);
console.log(`\nKeys used in code missing in EN (${usedMissingInEn.length}):`, usedMissingInEn);

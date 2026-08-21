import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../src');

const rawStringIssues = [];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();

        // Skip comments, imports, logs
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('import ') || trimmed.startsWith('console.')) {
            return;
        }

        // 1. Check raw text between JSX tags: >Some Text< (ignoring variables, expressions, icons)
        const jsxTagMatch = />\s*([A-Za-zÁÉÍÓÚáéíóúñÑ¿¡][A-Za-z0-9ÁÉÍÓÚáéíóúñÑ¿¡\s.,:;!?()/-]{2,})\s*</.exec(line);
        if (jsxTagMatch) {
            const rawText = jsxTagMatch[1].trim();
            // Ignore common non-translatable text like icons, single numbers, punctuation
            if (!rawText.startsWith('{') && !rawText.endsWith('}') && !['div', 'span', 'button', 'icon', 'root', 'header', 'p'].includes(rawText.toLowerCase())) {
                rawStringIssues.push({
                    file: path.relative(srcDir, filePath),
                    line: lineNum,
                    type: 'JSX_CHILD_TEXT',
                    text: rawText,
                    lineContent: trimmed
                });
            }
        }

        // 2. Check hardcoded attributes: placeholder="...", title="...", label="..." (not using t())
        const attrMatch = /\b(placeholder|title|label|alt|aria-label)=["']([A-Za-zÁÉÍÓÚáéíóúñÑ¿¡][^"']{3,})["']/.exec(line);
        if (attrMatch) {
            const attrName = attrMatch[1];
            const attrVal = attrMatch[2].trim();
            // Filter out classnames, urls, codes
            if (!attrVal.includes('styles.') && !attrVal.includes('var(') && !attrVal.startsWith('/') && !attrVal.startsWith('http')) {
                rawStringIssues.push({
                    file: path.relative(srcDir, filePath),
                    line: lineNum,
                    type: `ATTR_${attrName.toUpperCase()}`,
                    text: attrVal,
                    lineContent: trimmed
                });
            }
        }
    });
}

function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'dist') {
                traverse(fullPath);
            }
        } else if (entry.name.endsWith('.jsx')) {
            if (!entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
                scanFile(fullPath);
            }
        }
    }
}

traverse(srcDir);

console.log(`\n================ Raw Hardcoded JSX Strings Audit ================`);
console.log(`Total occurrences found: ${rawStringIssues.length}`);

const byFile = {};
rawStringIssues.forEach(iss => {
    byFile[iss.file] = (byFile[iss.file] || 0) + 1;
});

const topFiles = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
console.log(`\nTop files with hardcoded text (${topFiles.length} files affected):`);
topFiles.slice(0, 15).forEach(([f, count]) => {
    console.log(`  - ${f}: ${count} hardcoded string(s)`);
});

console.log(`\nSample occurrences:`);
rawStringIssues.slice(0, 10).forEach(iss => {
    console.log(`  [${iss.file}:${iss.line}] (${iss.type}): "${iss.text}"`);
});

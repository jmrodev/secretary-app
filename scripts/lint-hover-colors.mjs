#!/usr/bin/env node
// scripts/lint-hover-colors.mjs
// Regression guard for the hover audit (hover-states-audit / PR1).
// Fails (exit 1) when a hover color is hardcoded instead of token-based.
//
// Detects two patterns:
//   1. Direct hovers: a `:hover` block with a literal color (hex / rgb / rgba).
//   2. Hover indirection: a `--*-hover-*` custom property assigned a literal
//      color (e.g. `.Btn__success { --btn-hover-bg: #00a36c; }`), which is the
//      pattern this codebase uses to feed `:hover` blocks via var().
// Token-based values (var(--x)) are always allowed.
//
// The design-token source (variables.css) is excluded: defining tokens with
// literal values there is correct and expected.
//
// Usage:
//   node scripts/lint-hover-colors.mjs                 # scan client/src
//   node scripts/lint-hover-colors.mjs <file|dir> ...  # scan specific paths
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const COLOR_RE = /(#([0-9a-fA-F]{3,8})\b)|(rgba?\([^)]*\))/g;
const HOVER_PROP_RE = /(--[\w-]*hover[\w-]*)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))\s*;/g;
const targets = process.argv.slice(2);
const roots = targets.length ? targets : ['client/src'];

function collect(dir, out) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) collect(full, out);
        else if (extname(full) === '.css') out.push(full);
    }
}

const files = [];
for (const t of roots) {
    const st = statSync(t);
    if (st.isDirectory()) collect(t, files);
    else if (extname(t) === '.css') files.push(t);
}

const violations = [];
for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const isTokenSource = basename(file) === 'variables.css';

    // 1. Direct :hover blocks with a literal color.
    const hoverRe = /:hover[^{]*\{([^}]*)\}/g;
    let m;
    while ((m = hoverRe.exec(text)) !== null) {
        const colors = (m[1].match(COLOR_RE) || []).filter((c) => !c.includes('var('));
        if (colors.length) violations.push({ file, colors: colors.map((c) => c.trim()), where: ':hover' });
    }

    // 2. Hover custom properties with a literal color (skip the token source).
    if (!isTokenSource) {
        let p;
        while ((p = HOVER_PROP_RE.exec(text)) !== null) {
            if (!p[2].includes('var(')) violations.push({ file, colors: [p[2]], where: p[1] });
        }
    }
}

if (violations.length) {
    console.error(`✖ ${violations.length} hardcoded hover color(s):`);
    for (const v of violations) console.error(`  ${v.file} [${v.where}]: ${v.colors.join(', ')}`);
    process.exit(1);
}
console.log('✓ No hardcoded hover colors.');
process.exit(0);

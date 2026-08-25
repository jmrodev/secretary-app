#!/usr/bin/env node
/**
 * cleanup-orphan-debt.js — D1 one-off maintenance script.
 *
 * Removes pending transactions orphaned before the finance-debt lifecycle
 * change (debt rows whose appointment/request was deleted and never labeled).
 * It subsumes fix_orphans.sql: dangling `appointment_id` orphans are covered by
 * the same predicate. Only UNLABELED pending orphans are deleted; retained debt
 * labeled "Deuda (Turno Eliminado)" / "Saldo a favor (Turno Eliminado)" is
 * preserved. Rental-linked transactions are never touched.
 *
 * Usage:
 *   node scripts/maintenance/cleanup-orphan-debt.js            # print + delete
 *   node scripts/maintenance/cleanup-orphan-debt.js --dry-run  # print only
 */
const { DEBT_LABEL, CREDIT_LABEL } = require('../../services/finance/debtLifecycleService');

const ORPHAN_WHERE = `
        WHERE status = 'pending'
          AND rental_id IS NULL
          AND (
            (appointment_id IS NULL AND request_id IS NULL)
            OR (appointment_id IS NOT NULL AND appointment_id NOT IN (SELECT id FROM appointments))
            OR (request_id IS NOT NULL AND request_id NOT IN (SELECT id FROM medical_requests))
          )
          AND (description IS NULL OR (description NOT LIKE ? AND description NOT LIKE ?))
    `;

function buildCleanupSql(mode = 'delete') {
    const params = [`${DEBT_LABEL}:%`, `${CREDIT_LABEL}:%`];
    if (mode === 'select') {
        return {
            sql: `SELECT id, amount, description, appointment_id, request_id FROM transactions${ORPHAN_WHERE}`,
            params
        };
    }
    return { sql: `DELETE FROM transactions${ORPHAN_WHERE}`, params };
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const { pool } = require('../../db');

    const { sql: selectSql, params } = buildCleanupSql('select');
    const rows = await pool.query(selectSql, params);
    console.log(`[cleanup-orphan-debt] ${rows.length} unlabeled pending orphan(s) found.`);
    for (const row of rows) {
        console.log(`  #${row.id} amount=${row.amount} appointment_id=${row.appointment_id} request_id=${row.request_id} description="${row.description}"`);
    }

    if (dryRun || rows.length === 0) {
        console.log(dryRun ? '[cleanup-orphan-debt] Dry run: nothing deleted.' : '[cleanup-orphan-debt] Nothing to delete.');
        return;
    }

    const { sql: deleteSql } = buildCleanupSql('delete');
    const result = await pool.query(deleteSql, params);
    console.log(`[cleanup-orphan-debt] Deleted ${result.affectedRows} orphan(s).`);
}

if (require.main === module) {
    main().catch((err) => {
        console.error('[cleanup-orphan-debt] Failed:', err);
        process.exitCode = 1;
    });
}

module.exports = { buildCleanupSql, main };
const { pool } = require('../../db');

/**
 * InvoiceRepository
 * Handles data access for electronic invoices.
 */
class InvoiceRepository {
    async create(data, conn = pool) {
        const { transaction_id, cbte_tipo, punto_vta, cbte_nro, cae, cae_vto, imp_total } = data;
        return await conn.query(`
            INSERT INTO invoices (transaction_id, cbte_tipo, punto_vta, cbte_nro, cae, cae_vto, imp_total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [transaction_id, cbte_tipo, punto_vta, cbte_nro, cae, cae_vto, imp_total]);
    }

    async findByTransactionId(transactionId, conn = pool) {
        const rows = await conn.query("SELECT * FROM invoices WHERE transaction_id = ?", [transactionId]);
        return rows[0] || null;
    }
}

module.exports = new InvoiceRepository();

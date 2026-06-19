

/**
 * InvoiceRepository
 * Handles data access for electronic invoices.
 */
class InvoiceRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async create(data, conn = this.pool) {
        const { transaction_id, cbte_tipo, punto_vta, cbte_nro, cae, cae_vto, imp_total } = data;
        return await conn.query(`
            INSERT INTO invoices (transaction_id, cbte_tipo, punto_vta, cbte_nro, cae, cae_vto, imp_total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [transaction_id, cbte_tipo, punto_vta, cbte_nro, cae, cae_vto, imp_total]);
    }

    async findByTransactionId(transactionId, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM invoices WHERE transaction_id = ?", [transactionId]);
        return rows[0] || null;
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new InvoiceRepository(defaultPool);
const factory = (customPool) => new InvoiceRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;

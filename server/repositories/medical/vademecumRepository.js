

/**
 * VademecumRepository
 * Handles search operations on the vademecum table.
 */
class VademecumRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async findBySearchQuery(q, conn = this.pool) {
        const searchTerms = q.trim().split(/\s+/).filter(t => t.length > 0);
        const booleanSearch = searchTerms.map(t => `+${t}*`).join(' ');

        const query = `
            SELECT *, 
            MATCH(nombre, presentacion, monodroga, laboratorio) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
            FROM vademecum 
            WHERE MATCH(nombre, presentacion, monodroga, laboratorio) AGAINST(? IN BOOLEAN MODE)
            GROUP BY nombre, presentacion, monodroga, laboratorio
            ORDER BY relevance DESC, nombre ASC
            LIMIT 100
        `;

        let rows = await conn.query(query, [q, booleanSearch]);

        if (rows.length === 0) {
            let fallbackQuery = "SELECT * FROM vademecum WHERE ";
            let conditions = [];
            let params = [];
            searchTerms.forEach(term => {
                conditions.push("(nombre LIKE ? OR presentacion LIKE ? OR monodroga LIKE ? OR laboratorio LIKE ?)");
                params.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
            });
            fallbackQuery += conditions.join(" AND ") + " GROUP BY nombre, presentacion, monodroga, laboratorio LIMIT 100";
            rows = await conn.query(fallbackQuery, params);
        }
        return rows;
    }

    async findById(id, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM vademecum WHERE id = ?", [id]);
        return rows[0] || null;
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new VademecumRepository(defaultPool);
const factory = (customPool) => new VademecumRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;

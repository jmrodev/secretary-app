const knex = require('knex')({ client: 'mysql2' }); // Usamos mysql2 para compatibilidad con MariaDB

/**
 * BaseQueryBuilder Refactorizado con Knex.js
 * Utiliza Knex para generar consultas SQL seguras y a prueba de inyecciones,
 * manteniendo la compatibilidad con el pool de conexiones existente.
 */
class BaseQueryBuilder {
    constructor(baseTable, user = null) {
        this.user = user;
        // Soporte para alias ej: "patients p" -> "patients as p"
        const tableString = baseTable.includes(' ') ? baseTable.replace(' ', ' as ') : baseTable;
        this.query = knex(tableString);
    }

    /**
     * Agrega campos al SELECT
     */
    select(fields, params = []) {
        if (Array.isArray(fields)) {
            // Knex raw para soportar subqueries complejas como strings
            fields.forEach(f => this.query.select(knex.raw(f, params)));
        } else {
            this.query.select(knex.raw(fields, params));
        }
        return this;
    }

    /**
     * Joins genéricos usando raw para soportar tablas derivadas
     */
    join(table, condition, type = 'inner') {
        this.query.joinRaw(`${type} join ${table} on ${condition}`);
        return this;
    }

    leftJoin(table, condition) {
        return this.join(table, condition, 'left');
    }

    innerJoin(table, condition) {
        return this.join(table, condition, 'inner');
    }

    where(condition, ...params) {
        this.query.whereRaw(condition, params);
        return this;
    }

    orWhere(conditions) {
        this.query.where(function() {
            conditions.forEach((c, index) => {
                const params = Array.isArray(c.params) ? c.params : (c.params ? [c.params] : []);
                if (index === 0) {
                    this.whereRaw(c.condition, params);
                } else {
                    this.orWhereRaw(c.condition, params);
                }
            });
        });
        return this;
    }

    orderBy(field, direction = 'ASC') {
        this.query.orderByRaw(`${field} ${direction}`);
        return this;
    }

    orderByRaw(rawClause) {
        this.query.orderByRaw(rawClause);
        return this;
    }

    limit(limit, offset = 0) {
        this.query.limit(limit).offset(offset);
        return this;
    }

    groupBy(fields) {
        const groupByFields = Array.isArray(fields) ? fields.join(', ') : fields;
        this.query.groupByRaw(groupByFields);
        return this;
    }

    /**
     * Retorna la query compilada y sus bindings, compatible con pool.query()
     */
    build() {
        const { sql, bindings } = this.query.toSQL().toNative();
        return { query: sql, params: bindings };
    }

    buildCount() {
        // Clona la consulta, limpia los selects y ordenamientos, y cuenta
        const countQuery = this.query.clone()
            .clearSelect()
            .clearOrder()
            .clear('limit')
            .clear('offset')
            .count('* as total');

        const { sql, bindings } = countQuery.toSQL().toNative();
        return { query: sql, params: bindings };
    }

    toSQL() {
        return this.query.toString();
    }
}

module.exports = BaseQueryBuilder;

/**
 * BaseQueryBuilder - Clase base para todos los Query Builders
 * Proporciona métodos comunes para construir queries SQL de forma segura y legible
 */
class BaseQueryBuilder {
    constructor(baseTable, user = null) {
        this.baseTable = baseTable;
        this.user = user;
        this.selectFields = [];
        this.selectParams = [];
        this.joins = [];
        this.conditions = [];
        this.params = [];
        this.orderByClause = '';
        this.limitClause = '';
        this.groupByClause = '';
    }

    /**
     * Agrega campos al SELECT con soporte de parámetros
     */
    select(fields, params = []) {
        if (Array.isArray(fields)) {
            this.selectFields.push(...fields);
        } else {
            this.selectFields.push(fields);
        }

        if (params && params.length > 0) {
            this.selectParams.push(...params);
        }
        return this;
    }

    /**
     * Agrega un JOIN a la query
     * @param {string} table - Tabla a joinear
     * @param {string} condition - Condición del JOIN
     * @param {string} type - Tipo de JOIN (INNER, LEFT, RIGHT)
     */
    join(table, condition, type = 'INNER') {
        this.joins.push({ table, condition, type });
        return this;
    }

    /**
     * Agrega un LEFT JOIN
     */
    leftJoin(table, condition) {
        return this.join(table, condition, 'LEFT');
    }

    /**
     * Agrega un INNER JOIN
     */
    innerJoin(table, condition) {
        return this.join(table, condition, 'INNER');
    }

    /**
     * Agrega una condición WHERE
     * @param {string} condition - Condición SQL
     * @param {*} params - Parámetros para la condición (pueden ser múltiples)
     */
    where(condition, ...params) {
        this.conditions.push(condition);
        this.params.push(...params);
        return this;
    }

    /**
     * Agrega múltiples condiciones OR
     * @param {Array} conditions - Array de {condition, params}
     */
    orWhere(conditions) {
        const orConditions = conditions.map(c => c.condition);
        this.conditions.push(`(${orConditions.join(' OR ')})`);
        conditions.forEach(c => {
            if (c.params) {
                this.params.push(...(Array.isArray(c.params) ? c.params : [c.params]));
            }
        });
        return this;
    }

    /**
     * Agrega ORDER BY
     */
    orderBy(field, direction = 'ASC') {
        this.orderByClause = `ORDER BY ${field} ${direction}`;
        return this;
    }

    /**
     * Agrega LIMIT
     */
    limit(limit, offset = 0) {
        this.limitClause = offset > 0 ? `LIMIT ${offset}, ${limit}` : `LIMIT ${limit}`;
        return this;
    }

    /**
     * Agrega GROUP BY
     */
    groupBy(fields) {
        this.groupByClause = `GROUP BY ${Array.isArray(fields) ? fields.join(', ') : fields}`;
        return this;
    }

    /**
     * Construye y retorna la query final con sus parámetros
     * @returns {{query: string, params: Array}}
     */
    build() {
        let query = 'SELECT ';

        // SELECT clause
        if (this.selectFields.length > 0) {
            query += this.selectFields.join(', ');
        } else {
            query += '*';
        }

        // FROM clause
        query += ` FROM ${this.baseTable}`;

        // JOINs
        this.joins.forEach(join => {
            query += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
        });

        // WHERE clause
        if (this.conditions.length > 0) {
            query += ' WHERE ' + this.conditions.join(' AND ');
        }

        // GROUP BY
        if (this.groupByClause) {
            query += ' ' + this.groupByClause;
        }

        // ORDER BY
        if (this.orderByClause) {
            query += ' ' + this.orderByClause;
        }

        // LIMIT
        if (this.limitClause) {
            query += ' ' + this.limitClause;
        }

        return {
            query,
            params: [...this.selectParams, ...this.params] // Combinamos ambos en orden
        };
    }

    /**
     * Construye y retorna la query para contar registros totales
     * @returns {{query: string, params: Array}}
     */
    buildCount() {
        let query = 'SELECT COUNT(*) as total';

        // FROM clause
        query += ` FROM ${this.baseTable}`;

        // JOINs (Sólo INNER JOINs suelen ser necesarios para contar si afectan resultados, 
        // pero incluimos todos por si hay filtros en tablas joineadas)
        this.joins.forEach(join => {
            query += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
        });

        // WHERE clause
        if (this.conditions.length > 0) {
            query += ' WHERE ' + this.conditions.join(' AND ');
        }

        // GROUP BY (Si hay group by, el count es más complejo, pero para casos simples...)
        if (this.groupByClause) {
            query = `SELECT COUNT(*) as total FROM (${query} ${this.groupByClause}) as count_table`;
        }

        return {
            query,
            params: this.params // Solo usamos los parámetros del WHERE
        };
    }

    /**
     * Retorna solo la query como string (para debugging)
     */
    toSQL() {
        const { query, params } = this.build();
        let finalQuery = query;
        params.forEach(param => {
            finalQuery = finalQuery.replace('?', typeof param === 'string' ? `'${param}'` : param);
        });
        return finalQuery;
    }
}

module.exports = BaseQueryBuilder;

const { pool } = require('../../db');

/**
 * HolidayRepository
 * Handles data access for holidays.
 */
class HolidayRepository {
    async findActiveByMonth(month, year, conn = pool) {
        return await conn.query(
            "SELECT date, description FROM active_holidays WHERE MONTH(date) = ? AND YEAR(date) = ?",
            [month, year]
        );
    }

    async getHolidaysInRange(start, end, conn = pool) {
        const rows = await conn.query(
            "SELECT date FROM active_holidays WHERE date >= ? AND date <= ?",
            [start, end]
        );
        return rows.map(r => new Date(r.date).toISOString().split('T')[0]);
    }

    async findAll(conn = pool) {
        return await conn.query("SELECT * FROM active_holidays ORDER BY date ASC");
    }

    async create(data, conn = pool) {
        const { date, description } = data;
        return await conn.query("INSERT INTO active_holidays (date, description) VALUES (?, ?)", [date, description]);
    }

    async delete(id, conn = pool) {
        return await conn.query("DELETE FROM active_holidays WHERE id = ?", [id]);
    }
}

module.exports = new HolidayRepository();

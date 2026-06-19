

/**
 * OfficeRepository
 * Handles data access for Consultorios (Offices) and Rentals.
 */
class OfficeRepository {
    constructor(pool) {
        this.pool = pool;
    }

    // --- Consultorios ---
    async findAllOffices(conn = this.pool) {
        return await conn.query("SELECT * FROM consultorios");
    }

    async createOffice(data, conn = this.pool) {
        return await conn.query("INSERT INTO consultorios (name, description) VALUES (?, ?)", [data.name, data.description]);
    }

    // --- Rentals ---
    async createRental(data, conn = this.pool) {
        const { doctor_id, consultorio_id, rental_date, start_time, end_time, cost } = data;
        return await conn.query(
            "INSERT INTO office_rentals (doctor_id, consultorio_id, rental_date, start_time, end_time, cost) VALUES (?, ?, ?, ?, ?, ?)",
            [doctor_id, consultorio_id, rental_date, start_time, end_time, cost]
        );
    }

    async findRentalsByDoctor(doctorId, conn = this.pool) {
        return await conn.query(
            `SELECT r.*, c.name as consultorio_name 
             FROM office_rentals r 
             JOIN consultorios c ON r.consultorio_id = c.id 
             WHERE r.doctor_id = ?`,
            [doctorId]
        );
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new OfficeRepository(defaultPool);
const factory = (customPool) => new OfficeRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;

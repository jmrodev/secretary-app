const { pool } = require('../db');

// --- Consultorios (Offices) ---

exports.getAllConsultorios = async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM consultorios");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.createConsultorio = async (req, res) => {
    let conn;
    try {
        const { name, description } = req.body;
        conn = await pool.getConnection();
        await conn.query("INSERT INTO consultorios (name, description) VALUES (?, ?)", [name, description]);
        res.status(201).send("Consultorio created");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

// --- Rentals ---

exports.createRental = async (req, res) => {
    let conn;
    try {
        const { consultorio_id, rental_date, start_time, end_time, cost } = req.body;
        const user_id = req.user.user_id; // from token

        conn = await pool.getConnection();

        // Find doctor profile id
        const docRows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
        if (docRows.length === 0) return res.status(403).send("Not a doctor");
        const doctor_id = docRows[0].id;

        await conn.query(
            "INSERT INTO office_rentals (doctor_id, consultorio_id, rental_date, start_time, end_time, cost) VALUES (?, ?, ?, ?, ?, ?)",
            [doctor_id, consultorio_id, rental_date, start_time, end_time, cost]
        );
        res.status(201).send("Rental created");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

exports.getMyRentals = async (req, res) => {
    let conn;
    try {
        const user_id = req.user.user_id;
        conn = await pool.getConnection();

        const docRows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
        if (docRows.length === 0) return res.status(403).send("Not a doctor");
        const doctor_id = docRows[0].id;

        const rows = await conn.query(
            `SELECT r.*, c.name as consultorio_name 
             FROM office_rentals r 
             JOIN consultorios c ON r.consultorio_id = c.id 
             WHERE r.doctor_id = ?`,
            [doctor_id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

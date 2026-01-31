const { pool } = require('../db');
const { ROLES } = require('../constants/roles');

// Get schedule for a doctor
exports.getSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM doctor_schedules WHERE doctor_id = ? ORDER BY day_of_week, start_time", [doctorId]);
        conn.release();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

// Update schedule (Replace all)
exports.updateSchedule = async (req, res) => {
    let conn;
    try {
        const { doctorId } = req.params;
        const { schedule } = req.body; // Array of { day_of_week, start_time, end_time, is_break }

        conn = await pool.getConnection();
        // Permission Check
        const { role, user_id } = req.user;
        console.log(`[UpdateSchedule] Request by ${user_id} (${role}) for Doctor ${doctorId}`);

        if (role === ROLES.DOCTOR) {
            // Verify doctor owns this id
            const docRows = await conn.query("SELECT id FROM doctors WHERE user_id = ?", [user_id]);
            if (!docRows || docRows.length === 0 || docRows[0].id != doctorId) {
                await conn.release();
                return res.status(403).send("Unauthorized: Cannot edit another doctor's schedule");
            }
        } else if (role !== ROLES.ADMIN && role !== ROLES.SECRETARY) {
            await conn.release();
            return res.status(403).send("Unauthorized");
        }

        await conn.beginTransaction();

        // 1. Delete existing
        await conn.query("DELETE FROM doctor_schedules WHERE doctor_id = ?", [doctorId]);

        // 2. Insert new
        if (schedule && schedule.length > 0) {
            for (const item of schedule) {
                await conn.query(
                    "INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_break, default_type, force_hour_alignment) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [doctorId, item.day_of_week, item.start_time, item.end_time, item.is_break || 0, item.default_type || 'consultation', item.force_hour_alignment ? 1 : 0]
                );
            }
        }

        await conn.commit();
        console.log(`[UpdateSchedule] Successfully updated schedule for Doctor ${doctorId}`);
        res.json({ message: "Schedule updated successfully" });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        if (conn) conn.release();
    }
};

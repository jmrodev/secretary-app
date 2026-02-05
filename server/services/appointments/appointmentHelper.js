const { validateAdminPassword } = require('../../controllers/appointments/utils');
const { AuthRequiredError } = require('../../utils/errors');

const formatDateForDB = (date) => {
    try {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            console.error("[formatDateForDB] Invalid date input:", date);
            return null;
        }
        return d.toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).replace('T', ' ').slice(0, 19);
    } catch (err) {
        console.error("[formatDateForDB] Error formatting date:", date, err);
        return null;
    }
};

const freeSlot = async (conn, doctorId, appointmentDate) => {
    const formatted = formatDateForDB(appointmentDate);
    await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [doctorId, formatted]);
    await conn.query("INSERT INTO recently_freed_slots (doctor_id, slot_date) VALUES (?, ?)", [doctorId, formatted]);
};

const occupySlot = async (conn, doctorId, appointmentDate) => {
    const formatted = formatDateForDB(appointmentDate);
    await conn.query("DELETE FROM recently_freed_slots WHERE doctor_id = ? AND slot_date = ?", [doctorId, formatted]);
};

const checkModificationPermissions = async (conn, appt, user, adminPassword) => {
    const { role } = user;
    let override = false;

    if (adminPassword) {
        override = await validateAdminPassword(conn, adminPassword);
        if (!override) throw new Error("Contraseña de Administrador incorrecta.");
    }

    if (override || role === 'admin') return true;

    const now = new Date();
    const apptDate = new Date(appt.appointment_date);

    // Turnos Pasados
    if (apptDate < now) {
        const setting = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'allow_secretary_edit_past_appointments'");
        const canEdit = setting.length > 0 && (setting[0].setting_value === 'true' || setting[0].setting_value === '1');
        if (!canEdit) throw new AuthRequiredError("Requiere autorización de Administrador (Turno Pasado).");
    }

    // Turnos Atendidos/Completados
    if (['completed', 'attended', 'arrived'].includes(appt.status)) {
        const setting = await conn.query("SELECT setting_value FROM system_settings WHERE setting_key = 'enable_secretary_unrestricted_crud'");
        const canEdit = setting.length > 0 && (setting[0].setting_value === 'true' || setting[0].setting_value === '1');
        if (!canEdit) throw new AuthRequiredError("Requiere autorización de Administrador (Turno Completado/Atendido).");
    }

    return true;
};

module.exports = {
    formatDateForDB,
    freeSlot,
    occupySlot,
    checkModificationPermissions
};

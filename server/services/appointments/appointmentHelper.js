const { validateAdminPassword } = require('../../controllers/appointments/utils');
const { AuthRequiredError } = require('../../utils/core/errors');
const appointmentRepository = require('../../repositories/appointments/appointmentRepository');
const systemSettingsRepository = require('../../repositories/system/systemSettingsRepository');

const { formatLocalSQL } = require('../../utils/core/dateUtils');

const formatDateForDB = (date) => formatLocalSQL(date);

const freeSlot = async (conn, doctorId, appointmentDate) => {
    const formatted = formatDateForDB(appointmentDate);
    await appointmentRepository.addRecentlyFreedSlot(doctorId, formatted, conn);
};

const occupySlot = async (conn, doctorId, appointmentDate) => {
    const formatted = formatDateForDB(appointmentDate);
    await appointmentRepository.deleteFromRecentlyFreedSlots(doctorId, formatted, conn);
};

const checkModificationPermissions = async (conn, appt, user, adminPassword) => {
    const { role } = user;
    let override = false;

    if (adminPassword) {
        override = await validateAdminPassword(conn, adminPassword);
        if (!override) throw new Error("Contraseña de Administrador incorrecta.");
    }

    if (override || role === 'admin') return true;

    if (role === 'secretary') {
        const canCrud = user.permissions?.can_crud_appointments ?? user.can_crud_appointments;
        if (canCrud === false) {
            throw new AuthRequiredError("Requiere autorización de Administrador (Permiso para gestionar turnos no concedido).");
        }
    }

    const now = new Date();
    const apptDate = new Date(appt.appointment_date);

    // Turnos Pasados
    if (apptDate < now) {
        let canEditPast = false;
        if (role === 'secretary') {
            canEditPast = Boolean(user.permissions?.can_edit_past_appointments ?? user.can_edit_past_appointments);
        }
        if (!canEditPast) {
            const setting = await systemSettingsRepository.findByKey('allow_secretary_edit_past_appointments', conn);
            canEditPast = Boolean(setting && (setting.setting_value === 'true' || setting.setting_value === '1'));
        }
        if (!canEditPast) throw new AuthRequiredError("Requiere autorización de Administrador (Turno Pasado).");
    }

    // Turnos Atendidos/Completados
    if (['completed', 'attended', 'arrived'].includes(appt.status)) {
        const setting = await systemSettingsRepository.findByKey('enable_secretary_unrestricted_crud', conn);
        const canEdit = setting && (setting.setting_value === 'true' || setting.setting_value === '1');
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

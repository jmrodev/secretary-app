const { google } = require('googleapis');
const { logAction } = require('../../utils/audit');
const googleAuthService = require('./GoogleAuthService');
const googleIntegrationRepository = require('../../repositories/googleIntegrationRepository');
const systemSettingsRepository = require('../../repositories/systemSettingsRepository');
const appointmentRepository = require('../../repositories/appointmentRepository');
const { TIMEZONE } = require('../../utils/dateUtils');

/**
 * GoogleCalendarService
 * Handles appointment synchronization, conflict checking, and event management.
 */
class GoogleCalendarService {
    getColorForStatus(status, paymentStatus) {
        switch (status) {
            case 'confirmed': return '10'; // Basil (Green)
            case 'arrived': return '5';   // Banana (Yellow)
            case 'completed':
                if (paymentStatus === 'paid') return '10';
                if (paymentStatus === 'debt' || paymentStatus === 'partial') return '11'; // Tomato (Red)
                return '9'; // Blueberry (Blue)
            case 'absent': return '6';    // Tangerine (Orange)
            case 'pending': return '2';   // Sage
            default: return null;
        }
    }

    async _isSyncEnabled() {
        const setting = await systemSettingsRepository.findByKey('google_sync_enabled');
        return !setting || setting.setting_value === 'true' || setting.setting_value === '1';
    }

    async _getCalendar(doctorId) {
        const oauth2Client = await googleAuthService.getAuthorizedClient(doctorId);
        if (!oauth2Client) return null;
        return google.calendar({ version: 'v3', auth: oauth2Client });
    }

    async listEvents(doctorId, filters) {
        const calendar = await this._getCalendar(doctorId);
        if (!calendar) return { events: [] };

        const { start, end } = filters;
        const timeMin = start || (new Date()).toISOString();
        const maxResults = (start && end) ? 2500 : 10;

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin, timeMax: end, maxResults,
            singleEvents: true, orderBy: 'startTime',
        });

        return { events: response.data.items || [] };
    }

    async createEventHelper(doctorId, eventData, userId = null, req = null) {
        if (!await this._isSyncEnabled()) return null;
        const calendar = await this._getCalendar(doctorId);
        if (!calendar) return null;

        if (!eventData.start.timeZone) eventData.start.timeZone = TIMEZONE;
        if (!eventData.end.timeZone) eventData.end.timeZone = TIMEZONE;

        const result = await calendar.events.insert({ calendarId: 'primary', resource: eventData });

        if (userId || req) {
            const mockReq = req || { user: { user_id: userId, username: 'System' }, ip: 'SYSTEM' };
            await logAction(mockReq, 'CALENDAR_SYNC', `Synced Event ${result.data.id} to Doc ${doctorId}`);
        }
        return result.data;
    }

    async updateEventHelper(doctorId, eventId, updates, userId = null, req = null) {
        if (!eventId || !await this._isSyncEnabled()) return null;
        const calendar = await this._getCalendar(doctorId);
        if (!calendar) return null;

        const resource = {};
        if (updates.summary) resource.summary = updates.summary;
        if (updates.description) resource.description = updates.description;
        if (updates.start) resource.start = updates.start;
        if (updates.end) resource.end = updates.end;

        const colorId = this.getColorForStatus(updates.status, updates.paymentStatus);
        if (colorId) resource.colorId = colorId;

        const result = await calendar.events.patch({ calendarId: 'primary', eventId, resource });

        if (userId || req) {
            const mockReq = req || { user: { user_id: userId, username: 'System' }, ip: 'SYSTEM' };
            await logAction(mockReq, 'CALENDAR_SYNC_UPDATE', `Updated Google Event ${eventId} for Doc ${doctorId}`);
        }
        return result.data;
    }

    async deleteEventHelper(doctorId, eventId, userId = null, req = null) {
        if (!eventId) return null;
        if (!await this._isSyncEnabled()) return true;

        const calendar = await this._getCalendar(doctorId);
        if (!calendar) return null;

        try {
            await calendar.events.delete({ calendarId: 'primary', eventId });
            if (userId || req) {
                const mockReq = req || { user: { user_id: userId, username: 'System' }, ip: 'SYSTEM' };
                await logAction(mockReq, 'CALENDAR_SYNC_DELETE', `Deleted Google Event ${eventId} for Doc ${doctorId}`);
            }
            return true;
        } catch (err) {
            if (err.code === 404 || err.code === 410) return true;
            return false;
        }
    }

    async checkConflict(doctorId, startTime, endTime) {
        const calendar = await this._getCalendar(doctorId);
        if (!calendar) return false;

        const res = await calendar.freebusy.query({
            resource: { timeMin: startTime, timeMax: endTime, timeZone: TIMEZONE, items: [{ id: 'primary' }] }
        });

        const busy = res.data.calendars.primary.busy;
        return busy && busy.length > 0;
    }

    async getBusyIntervals(doctorId, startTime, endTime) {
        const calendar = await this._getCalendar(doctorId);
        if (!calendar) return [];

        const res = await calendar.freebusy.query({
            resource: { timeMin: startTime, timeMax: endTime, timeZone: TIMEZONE, items: [{ id: 'primary' }] }
        });

        return res.data.calendars.primary.busy || [];
    }

    async syncDayToGoogle(req, doctorId, date) {
        if (!await this._isSyncEnabled()) throw new Error("Google sync is currently disabled");

        const appointments = await appointmentRepository.findByDoctorAndDateForSync(doctorId, date);

        if (!appointments?.length) return { message: "No appointments found", total: 0 };

        const results = { created: 0, updated: 0, errors: 0, total: appointments.length };
        const statusLabels = { 'pending': 'Pendiente', 'confirmed': 'Confirmado', 'arrived': 'En sala', 'completed': 'Completado', 'absent': 'Ausente' };

        for (const appt of appointments) {
            try {
                const eventData = this._buildEventData(appt, statusLabels);
                if (appt.google_event_id) {
                    const success = await this.updateEventHelper(doctorId, appt.google_event_id, { ...eventData, status: appt.status, paymentStatus: appt.payment_status }, req.user.user_id, req);
                    if (success) results.updated++;
                    else await this._createNewEvent(doctorId, appt, eventData, req, results);
                } else {
                    await this._createNewEvent(doctorId, appt, eventData, req, results);
                }
            } catch (err) { results.errors++; }
        }
        return results;
    }

    _buildEventData(appt, statusLabels) {
        const startTime = new Date(appt.appointment_date);
        const duration = appt.duration || 60;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        let desc = `Motivo: ${appt.reason || 'Consulta'}\nEstado: ${statusLabels[appt.status] || appt.status}\nTipo: ${appt.type || 'Consulta'}`;
        if (appt.patient_phone) desc += `\nTeléfono: ${appt.patient_phone}`;
        if (appt.payment_status === 'paid' && appt.amount_paid > 0) desc += `\n💰 $${appt.amount_paid}`;
        else if (appt.payment_status === 'debt' && appt.amount_debt > 0) desc += `\n⚠️ $${appt.amount_debt}`;

        return {
            summary: appt.patient_name || 'Turno',
            description: desc,
            start: { dateTime: startTime.toISOString(), timeZone: TIMEZONE },
            end: { dateTime: endTime.toISOString(), timeZone: TIMEZONE },
            colorId: this.getColorForStatus(appt.status, appt.payment_status) || '0'
        };
    }

    async _createNewEvent(doctorId, appt, eventData, req, results) {
        const createResult = await this.createEventHelper(doctorId, eventData, req.user.user_id, req);
        if (createResult) {
            await appointmentRepository.update(appt.id, { google_event_id: createResult.id });
            results.created++;
        } else results.errors++;
    }

    async retryFailedSyncItems() {
        return await googleIntegrationRepository.resetSyncQueue();
    }
}

module.exports = new GoogleCalendarService();

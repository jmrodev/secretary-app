const httpMocks = require('node-mocks-http');
const modificationController = require('../appointments/modification');
const modificationService = require('../../services/appointments/modificationService');
const { ConflictError, AuthRequiredError } = require('../../utils/core/errors');

jest.mock('../../services/appointments/modificationService');
jest.mock('../../utils/system/audit', () => ({
    logAction: jest.fn()
}));
jest.mock('../../db', () => ({
    pool: {
        getConnection: jest.fn()
    }
}));

describe('ModificationController - updateAppointment', () => {
    let req, res;

    beforeEach(() => {
        req = httpMocks.createRequest({
            method: 'PUT',
            url: '/appointments/1',
            params: { id: '1' },
            body: {
                appointment_date: '2026-09-16 11:00:00',
                adminPassword: 'secret'
            },
            user: { user_id: 5, role: 'admin' }
        });
        res = httpMocks.createResponse();
        jest.clearAllMocks();
    });

    it('should return HTTP 200 with { success: true, message: "Appointment updated" } upon successful rescheduling', async () => {
        modificationService.updateAppointment.mockResolvedValue(true);

        await modificationController.updateAppointment(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({
            success: true,
            message: 'Appointment updated'
        });
        expect(modificationService.updateAppointment).toHaveBeenCalledWith(
            '1',
            { appointment_date: '2026-09-16 11:00:00' },
            5,
            { user_id: 5, role: 'admin' },
            'secret'
        );
    });

    it('should return HTTP 409 Conflict status with type GENERIC_ERROR when service throws ConflictError', async () => {
        const error = new ConflictError('Ya existe un turno confirmado en este horario.');
        modificationService.updateAppointment.mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await modificationController.updateAppointment(req, res);

        expect(res.statusCode).toBe(409);
        expect(res._getJSONData()).toEqual({
            error: 'Ya existe un turno confirmado en este horario.',
            type: 'GENERIC_ERROR'
        });

        consoleSpy.mockRestore();
    });

    it('should return HTTP 403 Forbidden status with type AUTH_REQUIRED when service throws AuthRequiredError', async () => {
        const error = new AuthRequiredError('Requiere autorización de Administrador (Turno Pasado).');
        modificationService.updateAppointment.mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await modificationController.updateAppointment(req, res);

        expect(res.statusCode).toBe(403);
        expect(res._getJSONData()).toEqual({
            error: 'Requiere autorización de Administrador (Turno Pasado).',
            type: 'AUTH_REQUIRED'
        });

        consoleSpy.mockRestore();
    });
});

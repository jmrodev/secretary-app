import { describe, it, expect } from 'vitest';
import { generateAppointmentBitacora } from '@/features/finances/hooks/useTransactionForm';

describe('generateAppointmentBitacora', () => {
    it('returns empty string when appt is not provided', () => {
        expect(generateAppointmentBitacora(null)).toBe('');
        expect(generateAppointmentBitacora(undefined)).toBe('');
    });

    it('formats basic appointment description with name and date', () => {
        const appt = {
            appointment_date: '2026-09-14T07:30:00.000Z',
            cost: 0,
            paid_amount: 0
        };
        const res = generateAppointmentBitacora(appt, 'Anahi Montero', 0);
        expect(res).toContain('Turno - Anahi Montero');
        expect(res).not.toContain('Total: $0');
    });

    it('includes milestones when available', () => {
        const appt = {
            appointment_date: '2026-09-14T07:30:00.000Z',
            created_at: '2026-09-14T09:41:00.000Z',
            confirmed_at: '2026-09-14T10:00:00.000Z',
            cost: 50000,
            paid_amount: 0
        };
        const res = generateAppointmentBitacora(appt, 'Anahi Montero', 50000);
        expect(res).toContain('Hitos:');
        expect(res).toContain('Creado:');
        expect(res).toContain('Conf:');
        expect(res).toContain('Total: $50000 | Cobrado: $50000 | Saldo: $0');
    });

    it('uses pending_amount as total cost when appt.cost is 0', () => {
        const appt = {
            appointment_date: '2026-09-14T07:30:00.000Z',
            cost: 0,
            pending_amount: 65000,
            paid_amount: 0
        };
        const res = generateAppointmentBitacora(appt, 'Anahi Montero', 65000);
        expect(res).toContain('Total: $65000 | Cobrado: $65000 | Saldo: $0');
    });

    it('prioritizes explicitTotal when provided dynamically from modal', () => {
        const appt = {
            appointment_date: '2026-09-14T07:30:00.000Z',
            cost: 0,
            pending_amount: 0,
            paid_amount: 0
        };
        const res = generateAppointmentBitacora(appt, 'Anahi Montero', 30000, 65000);
        expect(res).toContain('Total: $65000 | Cobrado: $30000 | Saldo: $35000');
    });

    it('calculates remaining saldo correctly with prior payments', () => {
        const appt = {
            appointment_date: '2026-09-14T07:30:00.000Z',
            cost: 65000,
            paid_amount: 20000
        };
        const res = generateAppointmentBitacora(appt, 'Anahi Montero', 25000);
        // Prior paid: 20000, current paid: 25000 => total cobrado: 45000, saldo: 20000
        expect(res).toContain('Total: $65000 | Cobrado: $45000 | Saldo: $20000');
    });
});

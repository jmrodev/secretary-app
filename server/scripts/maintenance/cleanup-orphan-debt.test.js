const { buildCleanupSql } = require('./cleanup-orphan-debt');

describe('cleanup-orphan-debt - D1 orphan predicate', () => {
    it('should build a DELETE that only targets unlabeled pending orphans (NULL or dangling FKs, rental excluded)', () => {
        const { sql, params } = buildCleanupSql('delete');

        expect(sql).toContain('DELETE FROM transactions');
        expect(sql).toContain("status = 'pending'");
        expect(sql).toContain('rental_id IS NULL');
        expect(sql).toContain('appointment_id IS NULL AND request_id IS NULL');
        expect(sql).toContain('appointment_id NOT IN (SELECT id FROM appointments)');
        expect(sql).toContain('request_id NOT IN (SELECT id FROM medical_requests)');
        expect(sql).toContain('description NOT LIKE ? AND description NOT LIKE ?');
        expect(params).toEqual(['Deuda (Turno Eliminado):%', 'Saldo a favor (Turno Eliminado):%']);
    });

    it('should build a SELECT that prints the same candidate rows', () => {
        const { sql, params } = buildCleanupSql('select');

        expect(sql).toContain('SELECT id, amount, description, appointment_id, request_id');
        expect(sql).toContain("status = 'pending'");
        expect(sql).toContain('rental_id IS NULL');
        expect(params).toEqual(['Deuda (Turno Eliminado):%', 'Saldo a favor (Turno Eliminado):%']);
    });

    it('should default to delete mode so the script removes orphans in a normal run', () => {
        const { sql } = buildCleanupSql();

        expect(sql).toContain('DELETE FROM transactions');
    });
});
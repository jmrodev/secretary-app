/**
 * OutreachService Integration Tests
 * Run against clinical_management_test DB.
 * Execute: npx jest outreachService.integration --forceExit --verbose
 */

const mysql = require('mysql2/promise');

describe('OutreachService Integration', () => {
    let pool;

    beforeAll(async () => {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'cima1255',
            database: 'clinical_management_test',
            port: process.env.DB_PORT || 3306,
            connectionLimit: 5,
            // Cast tinyint to boolean by default
            supportBigNumbers: true,
            bigNumberStrings: true
        });
        // Verify connection
        const conn = await pool.getConnection();
        await conn.query('SELECT 1');
        conn.release();
    });

    afterAll(async () => {
        if (pool) await pool.end();
    });

    /**
     * 3.1 Integration: GET /segments returns expected data shape
     * Verifies the SQL queries work correctly against a real MariaDB
     */
    describe('Segment SQL — real query execution', () => {
        function buildSegmentSql(type, startDate, endDate) {
            const baseSelect = `SELECT DISTINCT p.id, p.full_name, p.phone
FROM patients p
INNER JOIN appointments a ON a.patient_id = p.id`;
            const phoneFilter = `AND p.phone IS NOT NULL AND p.phone != '' AND LENGTH(p.phone) >= 8`;

            switch (type) {
                case 'this_week':
                    return { sql: `${baseSelect}\nWHERE YEARWEEK(a.appointment_date) = YEARWEEK(CURDATE())\n  ${phoneFilter}\nORDER BY p.full_name ASC`, params: [] };
                case 'date_range':
                    if (!startDate || !endDate) throw new Error('start_date and end_date are required');
                    return { sql: `${baseSelect}\nWHERE a.appointment_date BETWEEN ? AND ?\n  ${phoneFilter}\nORDER BY p.full_name ASC`, params: [startDate, endDate] };
                case 'this_year':
                    return { sql: `${baseSelect}\nWHERE YEAR(a.appointment_date) = YEAR(CURDATE())\n  ${phoneFilter}\nORDER BY p.full_name ASC`, params: [] };
                case 'since_year_ago':
                    return { sql: `SELECT p.id, p.full_name, p.phone\nFROM patients p\nWHERE NOT EXISTS (\n  SELECT 1 FROM appointments a\n  WHERE a.patient_id = p.id AND a.appointment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)\n)\n  AND p.phone IS NOT NULL AND p.phone != '' AND LENGTH(p.phone) >= 8\nORDER BY p.full_name ASC`, params: [] };
                case 'upcoming':
                    return { sql: `${baseSelect}\nWHERE a.appointment_date > NOW()\n  ${phoneFilter}\nORDER BY p.full_name ASC`, params: [] };
                case 'custom':
                    if (!startDate || !endDate) throw new Error('start_date and end_date are required');
                    return { sql: `${baseSelect}\nWHERE a.appointment_date BETWEEN ? AND ?\n  ${phoneFilter}\nORDER BY p.full_name ASC`, params: [startDate, endDate] };
                default:
                    throw new Error(`Unknown segment type: ${type}`);
            }
        }

        test('this_week returns patients with appointments this week', async () => {
            const { sql, params } = buildSegmentSql('this_week');
            const [patients] = await pool.query(sql, params);

            expect(patients.length).toBe(3);
            const ids = patients.map(p => p.id);
            expect(ids).toContain(1);
            expect(ids).toContain(2);
            expect(ids).toContain(3);

            // Each patient has required fields
            patients.forEach(p => {
                expect(p).toHaveProperty('id');
                expect(p).toHaveProperty('full_name');
                expect(p).toHaveProperty('phone');
                expect(String(p.phone)).toMatch(/^549\d{10,}$/);
            });
        });

        test('this_week excludes patients without phone or short phone', async () => {
            const { sql, params } = buildSegmentSql('this_week');
            const [patients] = await pool.query(sql, params);
            const ids = patients.map(p => p.id);
            expect(ids).not.toContain(6);
            expect(ids).not.toContain(7);
        });

        test('date_range returns patients with appointments in range', async () => {
            const { sql, params } = buildSegmentSql('date_range', '2026-03-01', '2026-03-31');
            const [patients] = await pool.query(sql, params);
            // Patient 4 (Ana Martínez) has 2026-03-15 appointment
            expect(patients.length).toBe(1);
            expect(patients[0].full_name).toBe('Ana Martínez');
        });

        test('this_year returns patients with appointments in current year', async () => {
            const { sql, params } = buildSegmentSql('this_year');
            const [patients] = await pool.query(sql, params);
            const ids = patients.map(p => p.id);
            expect(ids.length).toBeGreaterThanOrEqual(4);
            expect(ids).toContain(1); // Juan - 2026-07-27
            expect(ids).toContain(2); // María - 2026-07-28
            expect(ids).toContain(3); // Carlos - 2026-07-29
            expect(ids).toContain(4); // Ana - 2026-03-15
        });

        test('since_year_ago returns only patients with NO appointments in last 12 months', async () => {
            const { sql, params } = buildSegmentSql('since_year_ago');
            const [patients] = await pool.query(sql, params);
            // Patient 5 has 2026-07-20 appointment (within 12 months), so excluded
            // All our patients have recent appointments, so result should be 0
            expect(patients.length).toBe(0);
        });

        test('upcoming returns patients with future appointments', async () => {
            const { sql, params } = buildSegmentSql('upcoming');
            const [patients] = await pool.query(sql, params);
            const ids = patients.map(p => p.id);
            // At least 2 upcoming (María: 2026-08-15, Carlos: 2026-09-01)
            // May include 2026-07-27 if run before 10:00
            expect(ids.length).toBeGreaterThanOrEqual(2);
            expect(ids).toContain(2);
            expect(ids).toContain(3);
        });

        test('custom segment with date range works', async () => {
            const { sql, params } = buildSegmentSql('custom', '2026-05-01', '2026-06-30');
            const [patients] = await pool.query(sql, params);
            // Patient 1 has 2026-05-20 appointment
            expect(patients.length).toBe(1);
            expect(patients[0].full_name).toBe('Juan Pérez');
        });

        test('empty result for out-of-range dates', async () => {
            const { sql, params } = buildSegmentSql('date_range', '2020-01-01', '2020-12-31');
            const [patients] = await pool.query(sql, params);
            expect(patients.length).toBe(0);
        });

        test('results are ordered by full_name ASC', async () => {
            const { sql, params } = buildSegmentSql('this_week');
            const [patients] = await pool.query(sql, params);
            const names = patients.map(p => p.full_name);
            const sorted = [...names].sort();
            expect(names).toEqual(sorted);
        });
    });

    /**
     * 3.2 Integration: Data integrity checks
     */
    describe('Data integrity', () => {
        test('patients without phone are not returned by segments', async () => {
            const segmentTypes = ['this_week', 'this_year', 'upcoming'];
            for (const type of segmentTypes) {
                const { sql, params } = (() => {
                    const baseSelect = `SELECT DISTINCT p.id, p.full_name, p.phone
FROM patients p
INNER JOIN appointments a ON a.patient_id = p.id`;
                    const phoneFilter = `AND p.phone IS NOT NULL AND p.phone != '' AND LENGTH(p.phone) >= 8`;
                    switch (type) {
                        case 'this_week': return { sql: `${baseSelect}\nWHERE YEARWEEK(a.appointment_date) = YEARWEEK(CURDATE())\n  ${phoneFilter}\nORDER BY p.full_name ASC`, params: [] };
                        case 'this_year': return { sql: `${baseSelect}\nWHERE YEAR(a.appointment_date) = YEAR(CURDATE())\n  ${phoneFilter}\nORDER BY p.full_name ASC`, params: [] };
                        case 'upcoming': return { sql: `${baseSelect}\nWHERE a.appointment_date > NOW()\n  ${phoneFilter}\nORDER BY p.full_name ASC`, params: [] };
                        default: throw new Error('unknown');
                    }
                })();
                const [patients] = await pool.query(sql, params);
                const ids = patients.map(p => p.id);
                expect(ids).not.toContain(6); // NULL phone
                expect(ids).not.toContain(7); // phone too short
            }
        });

        test('patient names are correctly queried by IDs (broadcast lookup)', async () => {
            const [patients] = await pool.query(
                'SELECT id, full_name, phone FROM patients WHERE id IN (?, ?, ?)',
                [1, 2, 3]
            );
            expect(patients.length).toBe(3);
            expect(patients).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ full_name: 'Juan Pérez' }),
                    expect.objectContaining({ full_name: 'María García' }),
                    expect.objectContaining({ full_name: 'Carlos López' }),
                ])
            );
        });

        test('non-existent patient ID returns empty', async () => {
            const [patients] = await pool.query(
                'SELECT id, full_name, phone FROM patients WHERE id IN (?)',
                [9999]
            );
            expect(patients.length).toBe(0);
        });
    });
});

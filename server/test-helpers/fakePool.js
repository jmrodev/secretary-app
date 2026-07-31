/**
 * In-memory fake MariaDB pool used by the pending-booking integration test.
 *
 * It only understands the exact SQL shapes emitted by
 * `pendingBookingRepository`. Rows live in memory per test, so the optimistic
 * lock (UPDATE ... WHERE status = 'pending') behaves like the real database:
 * affectedRows is 1 for the first winner and 0 for the second.
 */

function createFakePool(seed = {}) {
    const pendingRows = [...(seed.pendingBookings || [])];
    const secretaries = seed.secretaries || [
        { user_id: 11, full_name: 'Ana (Secretaria)' },
        { user_id: 12, full_name: 'Luis (Secretaria)' }
    ];
    let nextId = 100;

    const isActive = (row) => row.status === 'pending' || row.status === 'alternative_sent';

    function enrich(row) {
        const secretary = secretaries.find((s) => s.user_id === row.accepted_by);
        return {
            ...row,
            patient_name: seed.patientNames?.[row.patient_id] || 'Paciente',
            doctor_name: seed.doctorNames?.[row.doctor_id] || 'Dr.',
            accepted_by_name: row.accepted_by ? secretary?.full_name || null : null
        };
    }

    return {
        async query(sql, params = []) {
            if (/^INSERT INTO whatsapp_pending_bookings/i.test(sql)) {
                const row = {
                    id: nextId++,
                    patient_id: params[0],
                    doctor_id: params[1],
                    patient_phone: params[2],
                    requested_slot_date: params[3],
                    requested_slot_time: params[4],
                    status: 'pending',
                    created_at: new Date('2026-08-01T10:00:00')
                };
                pendingRows.push(row);
                return { insertId: row.id };
            }

            if (/WHERE wb\.id = \?/i.test(sql)) {
                const row = pendingRows.find((r) => r.id === params[0]);
                return row ? [enrich(row)] : [];
            }

            if (/WHERE patient_id = \? AND status IN/i.test(sql)) {
                const rows = pendingRows
                    .filter((r) => r.patient_id === params[0] && isActive(r))
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                return rows.length ? [enrich(rows[0])] : [];
            }

            if (/WHERE wb\.status IN/i.test(sql)) {
                return pendingRows
                    .filter((r) => isActive(r))
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map(enrich);
            }

            if (/SET status = 'accepted'/i.test(sql)) {
                const row = pendingRows.find((r) => r.id === params[1] && r.status === 'pending');
                if (!row) return { affectedRows: 0 };
                row.status = 'accepted';
                row.accepted_by = params[0];
                row.accepted_at = new Date();
                return { affectedRows: 1 };
            }

            if (/SET status = 'alternative_sent'/i.test(sql)) {
                const row = pendingRows.find((r) => r.id === params[2] && r.status === 'pending');
                if (!row) return { affectedRows: 0 };
                row.status = 'alternative_sent';
                row.alternative_slot_iso = params[0];
                row.alternative_note = params[1];
                row.alternative_sent_at = new Date();
                return { affectedRows: 1 };
            }

            if (/SET status = 'alternative_accepted'/i.test(sql)) {
                const row = pendingRows.find((r) => r.id === params[1] && r.status === 'alternative_sent');
                if (!row) return { affectedRows: 0 };
                row.status = 'alternative_accepted';
                row.appointment_id = params[0];
                row.accepted_at = new Date();
                return { affectedRows: 1 };
            }

            if (/SET status = 'alternative_rejected'/i.test(sql)) {
                const row = pendingRows.find((r) => r.id === params[1] && r.status === 'alternative_sent');
                if (!row) return { affectedRows: 0 };
                row.status = 'alternative_rejected';
                row.rejected_reason = params[0];
                return { affectedRows: 1 };
            }

            if (/SET status = 'rejected'/i.test(sql)) {
                const row = pendingRows.find((r) => r.id === params[2]);
                if (!row) return { affectedRows: 0 };
                row.status = 'rejected';
                row.rejected_by = params[0];
                row.rejected_reason = params[1];
                return { affectedRows: 1 };
            }

            if (/SET status = 'timed_out'/i.test(sql)) {
                const stale = pendingRows.filter(
                    (r) => r.status === 'alternative_sent' && r.alternative_sent_at <= new Date(Date.now() - 2 * 3600 * 1000)
                );
                stale.forEach((r) => { r.status = 'timed_out'; });
                return { affectedRows: stale.length };
            }

            throw new Error(`Fake pool: unsupported query: ${sql}`);
        },
        _pendingRows: pendingRows
    };
}

module.exports = { createFakePool };

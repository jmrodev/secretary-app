import api from '@/api/axios';

/**
 * pendingBookingApi — API module for the supervised WhatsApp auto-booking queue.
 * Wraps the shared axios instance (baseURL `/api`); endpoints documented in
 * design.md (GET/POST /api/whatsapp/pending-bookings).
 */

/** GET /api/whatsapp/pending-bookings — active pending bookings (data array). */
export const listPending = async () => {
    const res = await api.get('/whatsapp/pending-bookings');
    return res.data?.data ?? [];
};

/** POST /api/whatsapp/pending-bookings/:id/accept — first-wins approval. */
export const acceptPending = async (id) => {
    const res = await api.post(`/whatsapp/pending-bookings/${id}/accept`);
    return res.data;
};

/** POST /api/whatsapp/pending-bookings/:id/suggest-alternative. */
export const suggestAlternative = async (id, alternativeSlotIso, note = '') => {
    const res = await api.post(`/whatsapp/pending-bookings/${id}/suggest-alternative`, {
        alternative_slot_iso: alternativeSlotIso,
        note
    });
    return res.data;
};

/** POST /api/whatsapp/pending-bookings/:id/reject — optional reason. */
export const rejectPending = async (id, reason = '') => {
    const res = await api.post(`/whatsapp/pending-bookings/${id}/reject`, { reason });
    return res.data;
};

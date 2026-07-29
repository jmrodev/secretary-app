/**
 * Calculates the final price for a medical service using the centralized DB function.
 * 
 * @param {Object} pool - DB Pool or Connection
 * @param {number} doctorId - Doctor ID
 * @param {number} patientId - Patient ID
 * @param {string} serviceType - 'consultation', 'prescription', etc.
 * @returns {Promise<{price: number}>}
 */
async function calculatePrice(pool, doctorId, patientId, serviceType = 'consultation', appointmentInstitutionId = null) {
    try {
                const rows = await pool.query(
            "SELECT fn_calculate_service_price(?, ?, ?, ?) as price",
            [doctorId, patientId, serviceType, appointmentInstitutionId]
        );
        
        return {
            price: Number(rows[0]?.price || 0),
            explanation: "Calculated via Centralized DB Engine (fn_calculate_service_price)"
        };
    } catch (err) {
        console.error("Error calculating price via DB function", err);
        throw err;
    }
}

module.exports = { calculatePrice };


/**
 * Calculates the final price for a medical service based on Doctor's base price and Patient's tariff adjustments.
 * 
 * @param {Object} conn - Active DB connection
 * @param {number} doctorId - Doctor ID
 * @param {number} patientId - Patient ID
 * @param {string} serviceType - 'consultation', 'prescription', 'medical_license', 'virtual_consultation'
 * @returns {Promise<{price: number, explanation: string}>}
 */
async function calculatePrice(conn, doctorId, patientId, serviceType = 'consultation') {
    // Get Doctor Prices
    const docRows = await conn.query(
        "SELECT consultation_price, prescription_price, medical_license_price, virtual_consultation_price, certificate_price FROM doctors WHERE id = ?",
        [doctorId]
    );

    if (docRows.length === 0) {
        throw new Error("Doctor not found");
    }

    const d = docRows[0];
    let basePrice = 0;
    let priceType = 'Consultation';

    switch (serviceType) {
        case 'prescription':
            basePrice = Number(d.prescription_price) || 0;
            priceType = 'Prescription';
            break;
        case 'medical_license':
            basePrice = Number(d.medical_license_price) || 0;
            priceType = 'Medical License';
            break;
        case 'certificate':
            basePrice = Number(d.certificate_price) || 0;
            priceType = 'Certificate';
            break;
        case 'virtual_consultation':
            basePrice = Number(d.virtual_consultation_price) || 0;
            priceType = 'Virtual Consultation';
            break;
        case 'consultation':
        default:
            basePrice = Number(d.consultation_price) || 0;
            priceType = 'Consultation';
            break;
    }

    let finalPrice = basePrice;
    let explanation = `${priceType} Base: $${basePrice}`;

    // Get Patient Tariff
    if (patientId) {
        const patRows = await conn.query("SELECT tariff_percent, tariff_override FROM patients WHERE id = ?", [patientId]);
        if (patRows.length > 0) {
            const { tariff_percent, tariff_override } = patRows[0];
            const percent = Number(tariff_percent) || 0;
            const override = Number(tariff_override);

            if (!isNaN(override) && override > 0 && (serviceType === 'consultation' || !serviceType)) {
                // Override applies primarily to standard consultation
                finalPrice = override;
                explanation += ` | Override: $${override}`;
            } else if (percent !== 0) {
                const adjustment = basePrice * (percent / 100);
                finalPrice += adjustment;
                explanation += ` | Adj: ${percent}% ($${adjustment.toFixed(2)})`;
            }
        }
    }

    return { price: Number(finalPrice.toFixed(2)), explanation };
}

module.exports = { calculatePrice };

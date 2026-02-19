const medicationRepository = require('../../repositories/medicationRepository');
const vademecumRepository = require('../../repositories/vademecumRepository');

/**
 * MedicationService
 * Handles business logic for Vademecum and Patient Medications.
 */
class MedicationService {
    /**
     * Search vademecum medications
     * @param {string} q Search query
     */
    async searchVademecum(q) {
        if (!q || q.length < 2) return [];

        const rows = await vademecumRepository.findBySearchQuery(q);

        return rows.map(item => ({
            id: item.id,
            name: item.nombre,
            presentation: item.presentacion,
            drug: item.monodroga,
            lab: item.laboratorio,
            vademecum_type: item.vademecum_type,
            full_label: `${item.nombre} (${item.presentacion}) - ${item.monodroga} [${item.laboratorio}]`
        }));
    }

    /**
     * Get medications for a specific patient
     * @param {number} patientId
     */
    async getPatientMedications(patientId) {
        return await medicationRepository.findByPatientId(patientId);
    }

    /**
     * Add medication to patient
     */
    async addPatientMedication(medicationData, addedByUserId) {
        return await medicationRepository.create({
            ...medicationData,
            added_by: addedByUserId,
            is_chronic: medicationData.is_chronic ? 1 : 0,
            status: 'active'
        });
    }

    /**
     * Update patient medication
     */
    async updatePatientMedication(id, medicationData) {
        return await medicationRepository.update(id, {
            ...medicationData,
            is_chronic: medicationData.is_chronic ? 1 : 0
        });
    }

    /**
     * Discontinue patient medication
     */
    async deletePatientMedication(id) {
        return await medicationRepository.update(id, { status: 'discontinued' });
    }

    /**
     * Helper to calculate refill days
     */
    static calculateRefillDays(dailyUnitsConsumed, boxesCount, unitsPerBox) {
        const consumed = parseFloat(dailyUnitsConsumed);
        const count = parseInt(boxesCount);
        const upb = parseInt(unitsPerBox);

        if (!consumed || !count || !upb) return null;

        const totalQuantity = count * upb;
        if (totalQuantity <= 0 || consumed <= 0) return null;

        const refillDays = Math.floor(totalQuantity / consumed);
        return refillDays > 0 ? refillDays : null;
    }

    /**
     * Calculate next refill date as ISO string
     */
    static calculateNextRefillDate(dailyUnitsConsumed, boxesCount, unitsPerBox) {
        const days = this.calculateRefillDays(dailyUnitsConsumed, boxesCount, unitsPerBox);
        if (days === null) return null;

        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }
}

module.exports = new MedicationService();

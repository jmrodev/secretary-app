const doctorRepository = require('../repositories/doctorRepository');
const phoneRepository = require('../repositories/phoneRepository');

/**
 * DoctorService
 * Business logic for doctor management.
 */
class DoctorService {
    async getAllDoctors() {
        const rows = await doctorRepository.findAll();
        if (rows.length > 0) {
            const doctorIds = rows.map(r => r.id);
            const phoneMap = await phoneRepository.findByEntities('doctor', doctorIds);
            rows.forEach(r => {
                r.phoneNumbers = phoneMap[r.id] || [];
            });
        }
        return rows;
    }

    async updateDoctor(id, updates) {
        const { phoneNumbers, ...doctorUpdates } = updates;

        // 1. Update doctor profile
        if (Object.keys(doctorUpdates).length > 0) {
            await doctorRepository.updateById(id, doctorUpdates);
        }

        // 2. Handle Phone Numbers
        if (phoneNumbers !== undefined) {
            const primaryPhone = await phoneRepository.syncPhones('doctor', id, phoneNumbers);
            if (primaryPhone) {
                await doctorRepository.updateById(id, { phone: primaryPhone });
            }
        }
    }
}

module.exports = new DoctorService();

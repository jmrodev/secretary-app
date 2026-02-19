const officeRepository = require('../repositories/officeRepository');
const doctorRepository = require('../repositories/doctorRepository');

/**
 * OfficeService
 * Business logic for office rentals.
 */
class OfficeService {
    async getAllOffices() {
        return await officeRepository.findAllOffices();
    }

    async createOffice(data) {
        return await officeRepository.createOffice(data);
    }

    async createRental(userId, data) {
        const doc = await doctorRepository.getDoctorConfigByUserId(userId);
        if (!doc) throw new Error("Not a doctor");

        return await officeRepository.createRental({
            ...data,
            doctor_id: doc.id
        });
    }

    async getMyRentals(userId) {
        const doc = await doctorRepository.getDoctorConfigByUserId(userId);
        if (!doc) throw new Error("Not a doctor");

        return await officeRepository.findRentalsByDoctor(doc.id);
    }
}

module.exports = new OfficeService();

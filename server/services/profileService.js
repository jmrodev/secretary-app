const doctorRepository = require('../repositories/doctorRepository');
const patientRepository = require('../repositories/patientRepository');
const secretaryRepository = require('../repositories/secretaryRepository');
const phoneRepository = require('../repositories/phoneRepository');

/**
 * ProfileService
 * Business logic for user profiles across different roles.
 */
class ProfileService {
    async getProfile(user) {
        const { role, user_id } = user;

        if (role === 'admin') {
            return { role, user_id, username: 'Admin' };
        }

        let profile;
        if (role === 'secretary') {
            profile = await secretaryRepository.findByUserId(user_id);
        } else if (role === 'doctor') {
            profile = await doctorRepository.findByUserId(user_id);
        } else if (role === 'patient') {
            profile = await patientRepository.findByUserId(user_id);
        }

        if (profile) {
            const phoneNumbers = await phoneRepository.findByEntity(role, profile.id);
            return { ...profile, role, phoneNumbers };
        }
        return null;
    }

    async updateProfile(user, updates) {
        const { role, user_id } = user;
        const { phoneNumbers, ...profileUpdates } = updates;

        let profile;
        let repository;
        if (role === 'patient') {
            profile = await patientRepository.findByUserId(user_id);
            repository = patientRepository;
        } else if (role === 'doctor') {
            profile = await doctorRepository.findByUserId(user_id);
            repository = doctorRepository;
        } else if (role === 'secretary') {
            profile = await secretaryRepository.findByUserId(user_id);
            repository = secretaryRepository;
        }

        if (!profile) throw new Error("Profile not found");

        if (Object.keys(profileUpdates).length > 0) {
            // patientRepository uses update(id, updates), doctor/secretary use updateByUserId
            if (role === 'patient') {
                await repository.update(profile.id, profileUpdates);
            } else {
                await repository.updateByUserId(user_id, profileUpdates);
            }
        }

        if (phoneNumbers !== undefined) {
            const primaryPhone = await phoneRepository.syncPhones(role, profile.id, phoneNumbers);
            if (primaryPhone) {
                if (role === 'patient') {
                    await repository.update(profile.id, { phone: primaryPhone });
                } else {
                    await repository.updateByUserId(user_id, { phone: primaryPhone });
                }
            }
        }
    }
}

module.exports = new ProfileService();

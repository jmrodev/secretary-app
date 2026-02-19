const doctorModel = require('../models/DoctorModel');
const patientModel = require('../models/PatientModel');
const secretaryModel = require('../models/SecretaryModel');
const phoneModel = require('../models/PhoneModel');

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

        let profileRows;
        if (role === 'secretary') {
            profileRows = await secretaryModel.findByUserId(user_id);
        } else if (role === 'doctor') {
            profileRows = await doctorModel.findByUserId(user_id);
        } else if (role === 'patient') {
            profileRows = await patientModel.findByUserId(user_id);
        }

        if (profileRows && profileRows.length > 0) {
            const profile = profileRows[0];
            const phoneNumbers = await phoneModel.findByEntity(role, profile.id);
            return { ...profile, role, phoneNumbers };
        }
        return null;
    }

    async updateProfile(user, updates) {
        const { role, user_id } = user;
        const { phoneNumbers, ...profileUpdates } = updates;

        let profileId;
        let model;
        if (role === 'patient') {
            const [p] = await patientModel.findByUserId(user_id);
            profileId = p?.id;
            model = patientModel;
        } else if (role === 'doctor') {
            const [d] = await doctorModel.findByUserId(user_id);
            profileId = d?.id;
            model = doctorModel;
        } else if (role === 'secretary') {
            const [s] = await secretaryModel.findByUserId(user_id);
            profileId = s?.id;
            model = secretaryModel;
        }

        if (!profileId) throw new Error("Profile not found");

        if (Object.keys(profileUpdates).length > 0) {
            await model.update(role === 'patient' ? profileId : user_id, profileUpdates);
        }

        if (phoneNumbers !== undefined) {
            const primaryPhone = await phoneModel.syncPhones(role, profileId, phoneNumbers);
            if (primaryPhone) {
                await model.update(role === 'patient' ? profileId : user_id, { phone: primaryPhone });
            }
        }
    }
}

module.exports = new ProfileService();
